import { supabase } from '$lib/supabaseClient';
import { notifications } from '$lib/stores/notifications';

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
  keystrokes: number;
  durationSeconds: number;
}

function createTelemetryStore() {
  let state = $state<SessionState>({
    isActive: false,
    isInitialized: false,
    sceneId: '',
    serialId: '',
    sessionType: 'play',
    startTime: 0,
    lastActive: 0,
    startingWordCount: 0,
    currentWordCount: 0,
    keystrokes: 0,
    durationSeconds: 0,
  });

  let timerInterval: any = null;

  // Deriving WPM based on net words written or characters typed?
  // Standard WPM = (Words Written / Time in Minutes)
  // Let's make it rolling WPM: (Words written in this session / minutes elapsed)
  let wpm = $derived.by(() => {
    if (!state.isActive || state.durationSeconds <= 0) return 0;
    const minutes = state.durationSeconds / 60;
    const netWords = Math.max(0, state.currentWordCount - state.startingWordCount);
    return Math.round(netWords / minutes);
  });

  function startSession(sceneId: string, serialId: string, sessionType: 'play' | 'edit', initialWordCount: number) {
    if (state.isActive) {
      endSession();
    }

    state = {
      isActive: false,
      isInitialized: true,
      sceneId,
      serialId,
      sessionType,
      startTime: 0,
      lastActive: 0,
      startingWordCount: initialWordCount,
      currentWordCount: initialWordCount,
      keystrokes: 0,
      durationSeconds: 0,
    };

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function recordActivity(wordCount: number) {
    if (!state.isInitialized) return;

    if (!state.isActive) {
      // Lazy start on the very first editor change!
      const now = Date.now();
      state.isActive = true;
      state.startTime = now;
      state.lastActive = now;

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        tick();
      }, 1000);
    }

    state.currentWordCount = wordCount;
    state.keystrokes += 1;
    state.lastActive = Date.now();
  }

  function tick() {
    if (!state.isActive) return;
    const now = Date.now();
    const idleLimit = 15 * 60 * 1000; // 15 minutes in ms

    if (now - state.lastActive < idleLimit) {
      state.durationSeconds += 1;
    } else {
      // 15 minutes of inactivity reached! Auto-flush session using backdated values.
      endSession(true);
    }
  }

  async function endSession(isIdleTimeout = false) {
    if (!state.isActive) return;

    // Clear interval immediately to prevent duplicate runs
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const sessionToSave = { ...state };
    
    // Reset state first to avoid UI lag
    state = {
      isActive: false,
      isInitialized: false,
      sceneId: '',
      serialId: '',
      sessionType: 'play',
      startTime: 0,
      lastActive: 0,
      startingWordCount: 0,
      currentWordCount: 0,
      keystrokes: 0,
      durationSeconds: 0,
    };

    // Calculate times
    const endTime = isIdleTimeout ? sessionToSave.lastActive : Date.now();
    const duration = sessionToSave.durationSeconds;

    // Don't save if there was absolutely zero activity or duration is 0
    if (duration <= 0 && sessionToSave.keystrokes === 0) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
    get isActive() { return state.isActive; },
    get sceneId() { return state.sceneId; },
    get sessionType() { return state.sessionType; },
    get keystrokes() { return state.keystrokes; },
    get durationSeconds() { return state.durationSeconds; },
    get currentWordCount() { return state.currentWordCount; },
    get startingWordCount() { return state.startingWordCount; },
    get wpm() { return wpm; },
    startSession,
    recordActivity,
    endSession,
  };
}

export const telemetryStore = createTelemetryStore();
