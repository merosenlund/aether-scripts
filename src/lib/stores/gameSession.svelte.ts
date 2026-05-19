interface Roll {
	id: string;
	formula: string;
	result: number;
	timestamp: number;
}

function createGameSession() {
	let rolls = $state<Roll[]>([]);

	return {
		get rolls() {
			return rolls;
		},
		addRoll: (formula: string, result: number) => {
			rolls = [{ id: crypto.randomUUID(), formula, result, timestamp: Date.now() }, ...rolls].slice(
				0,
				50
			); // Keep last 50 rolls
		},
		clearRolls: () => {
			rolls = [];
		}
	};
}

export const gameSession = createGameSession();
