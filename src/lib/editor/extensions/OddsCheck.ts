import { Node, mergeAttributes } from '@tiptap/core';

export const OddsCheck = Node.create({
	name: 'oddsCheck',
	group: 'inline',
	inline: true,
	atom: true,

	addAttributes() {
		return {
			target: { default: 50 },
			roll: { default: null }
		};
	},

	parseHTML() {
		return [{ tag: 'span[data-type="odds-check"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		const target = HTMLAttributes.target || 50;
		const roll = HTMLAttributes.roll !== null ? HTMLAttributes.roll : '?';
		const isSuccess = roll !== '?' && Number(roll) <= Number(target);
		const resultText = isSuccess ? 'YES' : 'NO';

		// Check for "Exceptional" success/failure (Mythic rule: 1/5 of the odds)
		const exceptionalThreshold = Math.floor(target / 5);
		const failureThreshold = 100 - Math.floor((100 - target) / 5);

		let label = resultText;
		if (roll !== '?') {
			if (Number(roll) <= exceptionalThreshold) label = 'EXCEPTIONAL YES';
			else if (Number(roll) >= failureThreshold) label = 'EXCEPTIONAL NO';
		}

		const text = `🎲 ${roll} vs ${target} [${label}]`;

		return [
			'span',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'odds-check',
				class: `inline-flex items-center px-2 py-0.5 rounded text-xs font-bold shadow-sm select-none mx-1 cursor-pointer transition-all ${
					roll === '?'
						? 'bg-stone-800 text-stone-400'
						: isSuccess
							? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
							: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
				}`
			}),
			text
		];
	},

	renderText({ node }) {
		const target = node.attrs.target || 50;
		const roll = node.attrs.roll !== null && node.attrs.roll !== undefined ? node.attrs.roll : '?';
		const isSuccess = roll !== '?' && Number(roll) <= Number(target);
		const resultText = isSuccess ? 'YES' : 'NO';

		const exceptionalThreshold = Math.floor(target / 5);
		const failureThreshold = 100 - Math.floor((100 - target) / 5);

		let label = resultText;
		if (roll !== '?') {
			if (Number(roll) <= exceptionalThreshold) label = 'EXCEPTIONAL YES';
			else if (Number(roll) >= failureThreshold) label = 'EXCEPTIONAL NO';
		}

		return `🎲 ${roll} vs ${target} [${label}]`;
	}
});
