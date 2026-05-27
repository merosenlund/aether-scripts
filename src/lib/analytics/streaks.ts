export interface HeatmapDay {
	date: string; // YYYY-MM-DD in user's local timezone
	sessionCount: number;
	wordCount: number; // net words written that day
}

export interface StreakData {
	currentStreak: number;
	longestStreak: number;
	daysThisWeek: number;
	daysThisMonth: number;
	daysThisYear: number;
	consistencyScore: number; // % of last 30 days with at least 1 session
	heatmapDays: HeatmapDay[]; // 364 days ending today, oldest first
}

type SessionForStreak = {
	start_time: string;
	ending_word_count: number;
	starting_word_count: number;
};

// Always use en-CA locale for YYYY-MM-DD format in the user's local timezone.
// Never use toISOString().slice(0,10) — that operates on UTC midnight and will
// misplace sessions for users in UTC+ and UTC- timezones.
function toLocalDate(ts: string): string {
	return new Date(ts).toLocaleDateString('en-CA');
}

export function computeStreaks(sessions: SessionForStreak[]): StreakData {
	const dayMap = new Map<string, { sessionCount: number; wordCount: number }>();

	for (const s of sessions) {
		const date = toLocalDate(s.start_time);
		const prev = dayMap.get(date) ?? { sessionCount: 0, wordCount: 0 };
		dayMap.set(date, {
			sessionCount: prev.sessionCount + 1,
			wordCount:
				prev.wordCount + Math.max(0, (s.ending_word_count ?? 0) - (s.starting_word_count ?? 0))
		});
	}

	const today = new Date();
	const todayStr = toLocalDate(today.toISOString());

	// Current streak: walk backward from today until a day with no session
	let currentStreak = 0;
	const cursor = new Date(today);
	while (dayMap.has(cursor.toLocaleDateString('en-CA'))) {
		currentStreak++;
		cursor.setDate(cursor.getDate() - 1);
	}

	// Longest streak: one pass over sorted dates finding the longest consecutive run
	const sortedDates = Array.from(dayMap.keys()).sort();
	let longestStreak = 0;
	let run = 0;
	let prevDate: Date | null = null;
	for (const dateStr of sortedDates) {
		// Use noon to avoid DST edge cases when computing day differences
		const d = new Date(dateStr + 'T12:00:00');
		if (prevDate) {
			const diff = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
			run = diff === 1 ? run + 1 : 1;
		} else {
			run = 1;
		}
		longestStreak = Math.max(longestStreak, run);
		prevDate = d;
	}

	// Days this week (ISO week: Monday–Sunday)
	const dow = today.getDay(); // 0=Sun
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - ((dow + 6) % 7));
	startOfWeek.setHours(0, 0, 0, 0);
	let daysThisWeek = 0;
	const wc = new Date(startOfWeek);
	while (wc <= today) {
		if (dayMap.has(wc.toLocaleDateString('en-CA'))) daysThisWeek++;
		wc.setDate(wc.getDate() + 1);
	}

	// Days this month
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	let daysThisMonth = 0;
	const mc = new Date(startOfMonth);
	while (mc <= today) {
		if (dayMap.has(mc.toLocaleDateString('en-CA'))) daysThisMonth++;
		mc.setDate(mc.getDate() + 1);
	}

	// Days this year
	const yearPrefix = String(today.getFullYear());
	let daysThisYear = 0;
	for (const dateStr of dayMap.keys()) {
		if (dateStr.startsWith(yearPrefix) && dateStr <= todayStr) daysThisYear++;
	}

	// Consistency score: % of last 30 days (including today) with at least 1 session
	let consistencyCount = 0;
	for (let i = 0; i < 30; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		if (dayMap.has(d.toLocaleDateString('en-CA'))) consistencyCount++;
	}
	const consistencyScore = Math.round((consistencyCount / 30) * 100);

	// Heatmap: 364 days back from today, oldest first
	const heatmapDays: HeatmapDay[] = [];
	for (let i = 363; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString('en-CA');
		const entry = dayMap.get(dateStr);
		heatmapDays.push({
			date: dateStr,
			sessionCount: entry?.sessionCount ?? 0,
			wordCount: entry?.wordCount ?? 0
		});
	}

	return {
		currentStreak,
		longestStreak,
		daysThisWeek,
		daysThisMonth,
		daysThisYear,
		consistencyScore,
		heatmapDays
	};
}
