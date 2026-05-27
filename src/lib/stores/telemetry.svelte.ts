import { supabase } from '$lib/supabaseClient';
import { notifications } from '$lib/stores/notifications';
import { computeReadabilityMetrics } from '$lib/analytics/readability';

interface SessionState {
	isActive: boolean;
	isInitialized: boolean;
	sceneId: string;
	serialId: string;
	sessionType: 'play' | 'edit';
	startTime: number;
	lastActive: number;
	startingWordCount: number;
	currentWordCount: number;
	startingCharCount: number;
	currentCharCount: number;
	currentText: string;
	keystrokes: number;
	durationSeconds: number;
}

const EMPTY_STATE: SessionState = {
	isActive: false,
	isInitialized: false,
	sceneId: '',
	serialId: '',
	sessionType: 'play',
	startTime: 0,
	lastActive: 0,
	startingWordCount: 0,
	currentWordCount: 0,
	startingCharCount: 0,
	currentCharCount: 0,
	currentText: '',
	keystrokes: 0,
	durationSeconds: 0
};

function createTelemetryStore() {
	let state = $state<SessionState>({ ...EMPTY_STATE });

	let timerInterval: any = null;

	let wpm = $derived.by(() => {
		if (!state.isActive || state.durationSeconds <= 0) return 0;
		const minutes = state.durationSeconds / 60;
		const netWords = Math.max(0, state.currentWordCount - state.startingWordCount);
		return Math.round(netWords / minutes);
	});

	function startSession(
		sceneId: string,
		serialId: string,
		sessionType: 'play' | 'edit',
		initialWordCount: number,
		initialCharCount = 0
	) {
		if (state.isActive) {
			endSession();
		}

		state = {
			...EMPTY_STATE,
			isInitialized: true,
			sceneId,
			serialId,
			sessionType,
			startingWordCount: initialWordCount,
			currentWordCount: initialWordCount,
			startingCharCount: initialCharCount,
			currentCharCount: initialCharCount
		};

		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function activateSession() {
		if (!state.isInitialized || state.isActive) return;
		const now = Date.now();
		state.isActive = true;
		state.startTime = now;
		state.lastActive = now;

		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			tick();
		}, 1000);
	}

	// Called by TelemetryExtension before the session is active to set precise
	// initial counts from the editor's actual document state.
	function setInitialCounts(wordCount: number, charCount: number, text: string) {
		if (!state.isActive) {
			state.startingWordCount = wordCount;
			state.currentWordCount = wordCount;
			state.startingCharCount = charCount;
			state.currentCharCount = charCount;
			state.currentText = text;
		}
	}

	function recordActivity(wordCount: number, charCount: number, text: string) {
		if (!state.isInitialized) return;

		if (!state.isActive) {
			activateSession();
		}

		state.currentWordCount = wordCount;
		state.currentCharCount = charCount;
		state.currentText = text;
		state.keystrokes += 1;
		state.lastActive = Date.now();
	}

	function tick() {
		if (!state.isActive) return;
		const now = Date.now();
		const idleLimit = 15 * 60 * 1000;

		if (now - state.lastActive < idleLimit) {
			state.durationSeconds += 1;
		} else {
			endSession(true);
		}
	}

	async function endSession(isIdleTimeout = false) {
		if (!state.isActive) return;

		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		const sessionToSave = { ...state };

		state = { ...EMPTY_STATE };

		const endTime = isIdleTimeout ? sessionToSave.lastActive : Date.now();
		const duration = sessionToSave.durationSeconds;

		if (duration <= 0 && sessionToSave.keystrokes === 0) {
			return;
		}

		const prose = sessionToSave.currentText
			? computeReadabilityMetrics(sessionToSave.currentText)
			: null;

		const netChars = sessionToSave.currentCharCount - sessionToSave.startingCharCount;

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase.from('writing_sessions').insert({
				author_id: user.id,
				serial_id: sessionToSave.serialId || null,
				scene_id: sessionToSave.sceneId || null,
				session_type: sessionToSave.sessionType,
				start_time: new Date(sessionToSave.startTime).toISOString(),
				end_time: new Date(endTime).toISOString(),
				active_duration_seconds: duration,
				starting_word_count: sessionToSave.startingWordCount,
				ending_word_count: sessionToSave.currentWordCount,
				keystrokes: sessionToSave.keystrokes,
				starting_char_count: sessionToSave.startingCharCount,
				net_characters: netChars,
				avg_sentence_length: prose?.avgSentenceLength ?? null,
				avg_word_length: prose?.avgWordLength ?? null,
				flesch_reading_ease: prose?.fleschReadingEase ?? null,
				type_token_ratio: prose?.typeTokenRatio ?? null
			});

			if (error) {
				console.error('Failed to save writing session:', error);
			} else if (isIdleTimeout) {
				notifications.info('Session auto-saved due to inactivity.');
			}
		} catch (err) {
			console.error('Error saving session:', err);
		}
	}

	return {
		get isActive() {
			return state.isActive;
		},
		get sceneId() {
			return state.sceneId;
		},
		get sessionType() {
			return state.sessionType;
		},
		get keystrokes() {
			return state.keystrokes;
		},
		get durationSeconds() {
			return state.durationSeconds;
		},
		get currentWordCount() {
			return state.currentWordCount;
		},
		get startingWordCount() {
			return state.startingWordCount;
		},
		get wpm() {
			return wpm;
		},
		startSession,
		activateSession,
		setInitialCounts,
		recordActivity,
		endSession
	};
}

export const telemetryStore = createTelemetryStore();
