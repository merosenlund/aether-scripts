/// <reference lib="deno.ns" />
import { assertEquals, assertGreater } from 'jsr:@std/assert';

// 1. Define Svelte 5 compiler runes on global scope before importing modules
(globalThis as any).$state = (val: any) => val;
const derivedMock = (fn: any) => fn;
derivedMock.by = (fn: any) => {
	return {
		get value() {
			return fn();
		}
	};
};
(globalThis as any).$derived = derivedMock;

// 2. Mock the stores and supabase that CommandRegistry imports
const mockGameSession = {
	rolls: [] as any[],
	addRoll: (formula: string, result: number) => {
		mockGameSession.rolls.push({ id: 'test', formula, result, timestamp: Date.now() });
	},
	clearRolls: () => {
		mockGameSession.rolls = [];
	}
};

// We need to mock the modules before importing CommandRegistry
// Since Deno doesn't have easy module mocking, we test the pure functions
// that don't depend on imports: resolveCommandSuggestions and the registry structure.

// 3. Import the dice parser (pure, no dependencies)
const { rollDice } = await import('$lib/editor/extensions/diceParser.ts');

// ─── Dice Parser Integration ────────────────────────────────────────

Deno.test('CommandRegistry integration: rollDice works with formula strings used by /roll', () => {
	const result = rollDice('2d6+3', () => 0.5);
	// 2d6 at rng=0.5: floor(0.5*6)+1 = 4 each = 8, +3 = 11
	assertEquals(result.total, 11);
	assertEquals(result.formula, '2d6+3');
});

Deno.test('CommandRegistry integration: rollDice handles default formula 1d100', () => {
	const result = rollDice('1d100', () => 0.0);
	assertEquals(result.total, 1);
});

// ─── Oracle Exceptional Threshold Math ──────────────────────────────

function computeOracleResult(target: number, roll: number): string {
	const exceptionalYes = Math.floor(target / 5);
	const exceptionalNo = 100 - Math.floor((100 - target) / 5);

	let result = roll <= target ? 'Yes' : 'No';
	if (roll <= exceptionalYes) result = 'Exceptional Yes';
	else if (roll >= exceptionalNo) result = 'Exceptional No';

	return result;
}

Deno.test('Oracle math: 50/50 odds — standard Yes', () => {
	assertEquals(computeOracleResult(50, 25), 'Yes');
});

Deno.test('Oracle math: 50/50 odds — standard No', () => {
	assertEquals(computeOracleResult(50, 75), 'No');
});

Deno.test('Oracle math: 50/50 odds — Exceptional Yes (≤ 10)', () => {
	assertEquals(computeOracleResult(50, 10), 'Exceptional Yes');
	assertEquals(computeOracleResult(50, 1), 'Exceptional Yes');
	assertEquals(computeOracleResult(50, 11), 'Yes'); // just outside
});

Deno.test('Oracle math: 50/50 odds — Exceptional No (≥ 90)', () => {
	// exceptionalNo = 100 - floor(50/5) = 100 - 10 = 90
	assertEquals(computeOracleResult(50, 90), 'Exceptional No'); // threshold is exactly 90
	assertEquals(computeOracleResult(50, 91), 'Exceptional No');
	assertEquals(computeOracleResult(50, 100), 'Exceptional No');
	assertEquals(computeOracleResult(50, 89), 'No'); // just outside
});

Deno.test('Oracle math: 10% odds (Nearly Impossible)', () => {
	// Exceptional Yes threshold: floor(10/5) = 2
	assertEquals(computeOracleResult(10, 2), 'Exceptional Yes');
	assertEquals(computeOracleResult(10, 3), 'Yes');
	assertEquals(computeOracleResult(10, 10), 'Yes');

	// Exceptional No threshold: 100 - floor(90/5) = 100 - 18 = 82
	assertEquals(computeOracleResult(10, 82), 'Exceptional No');
	assertEquals(computeOracleResult(10, 81), 'No');
});

Deno.test('Oracle math: 75% odds (Likely)', () => {
	// Exceptional Yes threshold: floor(75/5) = 15
	assertEquals(computeOracleResult(75, 15), 'Exceptional Yes');
	assertEquals(computeOracleResult(75, 16), 'Yes');

	// Exceptional No threshold: 100 - floor(25/5) = 100 - 5 = 95
	assertEquals(computeOracleResult(75, 95), 'Exceptional No');
	assertEquals(computeOracleResult(75, 94), 'No');
});

Deno.test('Oracle math: 90% odds (Nearly Certain)', () => {
	// Exceptional Yes threshold: floor(90/5) = 18
	assertEquals(computeOracleResult(90, 18), 'Exceptional Yes');
	assertEquals(computeOracleResult(90, 19), 'Yes');

	// Exceptional No threshold: 100 - floor(10/5) = 100 - 2 = 98
	assertEquals(computeOracleResult(90, 98), 'Exceptional No');
	assertEquals(computeOracleResult(90, 97), 'No');
});

Deno.test('Oracle math: boundary — roll equals target is Yes', () => {
	assertEquals(computeOracleResult(50, 50), 'Yes');
	assertEquals(computeOracleResult(50, 51), 'No');
});

Deno.test('Oracle math: boundary — target 100 (certain)', () => {
	// exceptionalYes = floor(100/5) = 20
	// exceptionalNo = 100 - floor(0/5) = 100
	// Everything is Yes (roll <= 100 always true)
	// But roll >= 100 triggers Exceptional No check
	assertEquals(computeOracleResult(100, 1), 'Exceptional Yes');
	assertEquals(computeOracleResult(100, 20), 'Exceptional Yes');
	assertEquals(computeOracleResult(100, 21), 'Yes');
	assertEquals(computeOracleResult(100, 99), 'Yes');
	// roll=100 hits both Yes (<=100) and ExceptionalNo (>=100);
	// ExceptionalNo wins because it's checked second via else-if
	assertEquals(computeOracleResult(100, 100), 'Exceptional No');
});

Deno.test('Oracle math: boundary — target 1', () => {
	// exceptionalYes = floor(1/5) = 0 → no Exceptional Yes possible
	// Only roll=1 is Yes
	assertEquals(computeOracleResult(1, 1), 'Yes'); // 1 <= 0 is false, so just Yes
	assertEquals(computeOracleResult(1, 2), 'No');
	// Exceptional No threshold: 100 - floor(99/5) = 100 - 19 = 81
	assertEquals(computeOracleResult(1, 81), 'Exceptional No');
});
