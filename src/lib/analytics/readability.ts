export interface ReadabilityMetrics {
	avgSentenceLength: number;
	avgWordLength: number;
	fleschReadingEase: number;
	typeTokenRatio: number;
}

function countSyllables(word: string): number {
	const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
	if (!cleaned) return 0;
	const matches = cleaned.match(/[aeiouy]+/g);
	let count = matches ? matches.length : 1;
	// Subtract silent trailing 'e' (e.g. "time", "place")
	if (cleaned.endsWith('e') && cleaned.length > 2) count = Math.max(1, count - 1);
	return Math.max(1, count);
}

export function computeReadabilityMetrics(plainText: string): ReadabilityMetrics {
	const text = plainText.trim();
	if (!text) {
		return { avgSentenceLength: 0, avgWordLength: 0, fleschReadingEase: 0, typeTokenRatio: 0 };
	}

	const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
	const sentenceCount = Math.max(1, sentences.length);

	const words = text.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z']/g, '').length > 0);
	const wordCount = Math.max(1, words.length);

	const avgSentenceLength = wordCount / sentenceCount;

	const totalChars = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0);
	const avgWordLength = totalChars / wordCount;

	const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
	// Flesch Reading Ease: 0 (very difficult) – 100 (very easy); typical fiction ~60–70
	const fleschReadingEase = Math.min(
		121,
		Math.max(0, 206.835 - 1.015 * avgSentenceLength - 84.6 * (totalSyllables / wordCount))
	);

	// Windowed TTR: capped at 500 words so long scenes don't score artificially low
	const windowWords = words
		.slice(0, 500)
		.map((w) => w.toLowerCase().replace(/[^a-z']/g, ''))
		.filter((w) => w.length > 0);
	const typeTokenRatio = new Set(windowWords).size / Math.max(1, windowWords.length);

	return {
		avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
		avgWordLength: Math.round(avgWordLength * 10) / 10,
		fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
		typeTokenRatio: Math.round(typeTokenRatio * 1000) / 1000
	};
}
