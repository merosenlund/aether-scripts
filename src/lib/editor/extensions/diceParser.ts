/**
 * Pure dice formula parser.
 *
 * Supports:
 *   - Basic:    1d20, 2d6, d100
 *   - Modifiers: 2d6+3, 1d20-1
 *   - Multiple groups: 2d6+1d8+5
 *
 * Returns `{ total, groups }` where each group is either a dice roll
 * (with individual die results) or a flat modifier.
 */

export interface DiceGroup {
	count: number;
	sides: number;
	rolls: number[];
	subtotal: number;
}

export interface ModifierGroup {
	value: number;
}

export type RollGroup = DiceGroup | ModifierGroup;

export interface RollResult {
	total: number;
	groups: RollGroup[];
	formula: string;
}

export function isDiceGroup(group: RollGroup): group is DiceGroup {
	return 'sides' in group;
}

/**
 * Parse and evaluate a dice formula string.
 *
 * @param formula - e.g. "2d6+3", "1d20-1", "2d6+1d8+5"
 * @param rng     - optional random number generator for testing (returns 0..1)
 */
export function rollDice(formula: string, rng: () => number = Math.random): RollResult {
	const cleaned = formula.replace(/\s+/g, '').toLowerCase();

	if (!cleaned) {
		return { total: 0, groups: [], formula };
	}

	// Tokenize into signed segments: split on +/- while keeping the sign
	// e.g. "2d6+1d8-3" => ["+2d6", "+1d8", "-3"]
	const tokens: string[] = [];
	let current = '';

	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];
		if ((char === '+' || char === '-') && i > 0) {
			tokens.push(current);
			current = char;
		} else {
			current += char;
		}
	}
	if (current) tokens.push(current);

	const groups: RollGroup[] = [];
	let total = 0;

	for (const token of tokens) {
		const diceMatch = token.match(/^([+-]?)(\d*)d(\d+)$/);

		if (diceMatch) {
			const sign = diceMatch[1] === '-' ? -1 : 1;
			const count = parseInt(diceMatch[2]) || 1;
			const sides = parseInt(diceMatch[3]);

			if (sides <= 0 || count <= 0) {
				groups.push({ value: 0 } as ModifierGroup);
				continue;
			}

			const rolls: number[] = [];
			let subtotal = 0;

			for (let i = 0; i < count; i++) {
				const roll = Math.floor(rng() * sides) + 1;
				rolls.push(roll);
				subtotal += roll;
			}

			subtotal *= sign;
			total += subtotal;

			groups.push({ count, sides, rolls, subtotal });
		} else {
			// Flat modifier (e.g. "+3", "-1", "5")
			const value = parseInt(token);
			if (!isNaN(value)) {
				total += value;
				groups.push({ value });
			}
		}
	}

	return { total, groups, formula };
}

// ─── Validation ─────────────────────────────────────────────────────

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate a dice formula string without rolling it.
 * Returns `{ valid: true }` or `{ valid: false, error: "..." }`.
 */
export function validateDiceFormula(formula: string): ValidationResult {
	const cleaned = formula.replace(/\s+/g, '').toLowerCase();

	if (!cleaned) {
		return { valid: false, error: 'Enter a dice formula (e.g., 2d6+3)' };
	}

	// Tokenize into signed segments
	const tokens: string[] = [];
	let current = '';

	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];
		if ((char === '+' || char === '-') && i > 0) {
			tokens.push(current);
			current = char;
		} else {
			current += char;
		}
	}
	if (current) tokens.push(current);

	for (const token of tokens) {
		const isDice = /^[+-]?\d*d\d+$/.test(token);
		const isNumber = /^[+-]?\d+$/.test(token);

		if (!isDice && !isNumber) {
			return { valid: false, error: `Unexpected "${token}" in formula` };
		}

		if (isDice) {
			const sides = parseInt(token.replace(/^[+-]?\d*d/, ''));
			if (sides <= 0) {
				return { valid: false, error: `Invalid die: d${sides} (sides must be > 0)` };
			}
		}
	}

	return { valid: true };
}
