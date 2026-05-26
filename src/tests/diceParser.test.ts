/// <reference lib="deno.ns" />
import { assertEquals, assertGreater, assertLessOrEqual } from 'jsr:@std/assert';
import { rollDice, isDiceGroup } from '$lib/editor/extensions/diceParser.ts';

// ─── Basic Formula Tests ────────────────────────────────────────────

Deno.test('rollDice: parses and rolls basic 1d20 formula', () => {
	// Deterministic rng: always returns 0.5 → floor(0.5 * 20) + 1 = 11
	const result = rollDice('1d20', () => 0.5);
	assertEquals(result.total, 11);
	assertEquals(result.groups.length, 1);
	const group = result.groups[0];
	assertEquals(isDiceGroup(group), true);
	if (isDiceGroup(group)) {
		assertEquals(group.count, 1);
		assertEquals(group.sides, 20);
		assertEquals(group.rolls, [11]);
		assertEquals(group.subtotal, 11);
	}
});

Deno.test('rollDice: parses 2d6 formula', () => {
	// rng cycles: first call 0.0 → 1, second call 0.99 → 6
	let callCount = 0;
	const rng = () => {
		callCount++;
		return callCount === 1 ? 0.0 : 0.99;
	};
	const result = rollDice('2d6', rng);
	assertEquals(result.total, 7); // 1 + 6
	const group = result.groups[0];
	if (isDiceGroup(group)) {
		assertEquals(group.count, 2);
		assertEquals(group.sides, 6);
		assertEquals(group.rolls, [1, 6]);
	}
});

Deno.test('rollDice: handles implicit count (d100 = 1d100)', () => {
	const result = rollDice('d100', () => 0.49);
	assertEquals(result.total, 50); // floor(0.49 * 100) + 1 = 50
	const group = result.groups[0];
	if (isDiceGroup(group)) {
		assertEquals(group.count, 1);
		assertEquals(group.sides, 100);
	}
});

// ─── Modifier Tests ─────────────────────────────────────────────────

Deno.test('rollDice: handles positive modifier (2d6+3)', () => {
	// All dice roll 1
	const result = rollDice('2d6+3', () => 0.0);
	assertEquals(result.total, 5); // 1 + 1 + 3
	assertEquals(result.groups.length, 2);
	if (isDiceGroup(result.groups[0])) {
		assertEquals(result.groups[0].subtotal, 2);
	}
	assertEquals(isDiceGroup(result.groups[1]), false);
	if (!isDiceGroup(result.groups[1])) {
		assertEquals(result.groups[1].value, 3);
	}
});

Deno.test('rollDice: handles negative modifier (1d20-1)', () => {
	const result = rollDice('1d20-1', () => 0.0);
	assertEquals(result.total, 0); // 1 - 1
});

// ─── Multiple Dice Groups ───────────────────────────────────────────

Deno.test('rollDice: handles multiple dice groups (2d6+1d8+5)', () => {
	let callCount = 0;
	const rng = () => {
		callCount++;
		// 2d6: both roll 3 (0.333...), 1d8: rolls 4 (0.375)
		if (callCount <= 2) return 1 / 3;
		return 0.375;
	};
	const result = rollDice('2d6+1d8+5', rng);
	// 2d6 = 3+3=6, 1d8 = floor(0.375*8)+1=4, +5 = 15
	assertEquals(result.total, 15);
	assertEquals(result.groups.length, 3);
});

// ─── Edge Cases ─────────────────────────────────────────────────────

Deno.test('rollDice: handles empty formula', () => {
	const result = rollDice('');
	assertEquals(result.total, 0);
	assertEquals(result.groups.length, 0);
});

Deno.test('rollDice: handles whitespace in formula', () => {
	const result = rollDice(' 1d20 ', () => 0.0);
	assertEquals(result.total, 1);
});

Deno.test('rollDice: handles pure number (flat modifier only)', () => {
	const result = rollDice('42');
	assertEquals(result.total, 42);
	assertEquals(result.groups.length, 1);
});

Deno.test('rollDice: is case insensitive', () => {
	const result = rollDice('1D20', () => 0.0);
	assertEquals(result.total, 1);
});

Deno.test('rollDice: handles 0 sides gracefully', () => {
	const result = rollDice('1d0');
	assertEquals(result.total, 0);
});

Deno.test('rollDice: preserves the original formula string', () => {
	const result = rollDice('2d6+3');
	assertEquals(result.formula, '2d6+3');
});

// ─── Randomness Bounds ──────────────────────────────────────────────

Deno.test('rollDice: results stay within expected bounds (1d6)', () => {
	for (let i = 0; i < 100; i++) {
		const result = rollDice('1d6');
		assertGreater(result.total, 0);
		assertLessOrEqual(result.total, 6);
	}
});

Deno.test('rollDice: results stay within expected bounds (2d6+3)', () => {
	for (let i = 0; i < 100; i++) {
		const result = rollDice('2d6+3');
		assertGreater(result.total, 4); // min 1+1+3 = 5
		assertLessOrEqual(result.total, 15); // max 6+6+3 = 15
	}
});

// ─── Validation Tests ───────────────────────────────────────────────

import { validateDiceFormula } from '$lib/editor/extensions/diceParser.ts';

Deno.test('validateDiceFormula: accepts valid basic formulas', () => {
	assertEquals(validateDiceFormula('1d20').valid, true);
	assertEquals(validateDiceFormula('2d6').valid, true);
	assertEquals(validateDiceFormula('d100').valid, true);
	assertEquals(validateDiceFormula('1d100').valid, true);
});

Deno.test('validateDiceFormula: accepts formulas with modifiers', () => {
	assertEquals(validateDiceFormula('2d6+3').valid, true);
	assertEquals(validateDiceFormula('1d20-1').valid, true);
	assertEquals(validateDiceFormula('2d6+1d8+5').valid, true);
});

Deno.test('validateDiceFormula: accepts pure numbers', () => {
	assertEquals(validateDiceFormula('42').valid, true);
});

Deno.test('validateDiceFormula: rejects empty formula', () => {
	const result = validateDiceFormula('');
	assertEquals(result.valid, false);
	assertGreater(result.error!.length, 0);
});

Deno.test('validateDiceFormula: rejects garbage text', () => {
	assertEquals(validateDiceFormula('hello').valid, false);
	assertEquals(validateDiceFormula('d6d').valid, false);
	assertEquals(validateDiceFormula('fdfsdf').valid, false);
	assertEquals(validateDiceFormula('fea32').valid, false);
});

Deno.test('validateDiceFormula: rejects mixed valid/invalid tokens', () => {
	const result = validateDiceFormula('2d6+abc');
	assertEquals(result.valid, false);
	assertGreater(result.error!.length, 0);
});

Deno.test('validateDiceFormula: rejects d0 (zero sides)', () => {
	const result = validateDiceFormula('1d0');
	assertEquals(result.valid, false);
});

Deno.test('validateDiceFormula: handles whitespace gracefully', () => {
	assertEquals(validateDiceFormula(' 2d6 + 3 ').valid, true);
});

