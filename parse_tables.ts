import { readFileSync, writeFileSync } from 'node:fs';

const content = readFileSync('./tables.md', 'utf-8');
const lines = content.split('\n');

const tables: any[] = [];
let currentTable: any = null;

for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const match = line.match(/^(\d+):\s*(.*)$/);
    if (match) {
        if (currentTable) {
            currentTable.entries.push(match[2].trim());
        }
    } else {
        // Assume this is a new table header
        if (currentTable) {
            tables.push(currentTable);
        }
        currentTable = {
            name: line,
            entries: []
        };
    }
}
if (currentTable) {
    tables.push(currentTable);
}

// Categorization logic based on plan
const categories: Record<string, string[]> = {
    'Core Oracle': ['Action 1', 'Action 2', 'Descriptor 1', 'Descriptor 2'],
    'World & Setting': ['Adventure Tone', 'Cavern Descriptors', 'City Descriptors', 'Civilization Descriptors', 'Domecile Descriptors', 'Dungeon Descriptors', 'Forest Descriptors', 'Locations', 'Starship Descriptors', 'Terrain Descriptors'],
    'Characters': ['Characters', 'Character Actions, Combat', 'Character Actions, General', 'Character Appearance', 'Character Background', 'Character Conversations', 'Character Descriptors', 'Character Identity', 'Character Motivations', 'Character Personality', 'Character Skills', 'Character Traits and Flaws'],
    'Creatures & Beings': ['Alien Species Descriptors', 'Animal Actions', 'Creature Abilties', 'Creature Descriptors', 'Gods', 'Undead Descriptors'],
    'Items & Objects': ['Magic Item Descriptors', 'Mutation Descriptors', 'Objects', 'Powers'],
    'Narrative': ['Cryptic Messages', 'Curses', 'Legends', 'Noble House', 'Plot Twist'],
    'Miscellaneous': ['Army Descriptors', 'Dungeon Traps', 'Names', 'Scavenging Results', 'Smells', 'Sounds', 'Spell Effects', 'Visions and Dreams']
};

function getCategory(name: string) {
    for (const [cat, names] of Object.entries(categories)) {
        if (names.includes(name)) return cat;
    }
    return 'Miscellaneous';
}

function getId(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Ensure 1-100 or 1-50 entries by padding if needed
for (const table of tables) {
    table.id = getId(table.name);
    table.category = getCategory(table.name);
    table.size = table.entries.length;
}

let output = `// Auto-generated from tables.md

export interface MythicTable {
	id: string;
	name: string;
	category: string;
	entries: string[];
	size: number;
}

export const mythicTables = new Map<string, MythicTable>();

`;

for (const table of tables) {
    output += `mythicTables.set('${table.id}', {
	id: '${table.id}',
	name: \`${table.name.replace(/`/g, '\\`')}\`,
	category: '${table.category}',
	size: ${table.size},
	entries: [
${table.entries.map((e: string) => `		\`${e.replace(/`/g, '\\`')}\``).join(',\n')}
	]
});

`;
}

output += `
export function lookupResult(tableId: string, roll: number): string {
	const table = mythicTables.get(tableId);
	if (!table) return '?';
	const index = Math.max(0, Math.min(roll - 1, table.size - 1));
	return table.entries[index] || '?';
}

export function rollOnTable(tableId: string): { roll: number; result: string } {
	const table = mythicTables.get(tableId);
	if (!table) return { roll: 1, result: '?' };
	const roll = Math.floor(Math.random() * table.size) + 1;
	return { roll, result: lookupResult(tableId, roll) };
}

export function rollMultiple(tableId: string, count: number): { roll: number; result: string }[] {
	const results = [];
	for (let i = 0; i < count; i++) {
		results.push(rollOnTable(tableId));
	}
	return results;
}

export function getTablesByCategory(): Map<string, MythicTable[]> {
	const map = new Map<string, MythicTable[]>();
	for (const table of mythicTables.values()) {
		const arr = map.get(table.category) || [];
		arr.push(table);
		map.set(table.category, arr);
	}
	return map;
}
`;

writeFileSync('./src/lib/editor/extensions/mythicTables.ts', output);
console.log('Successfully generated mythicTables.ts with', tables.length, 'tables.');
