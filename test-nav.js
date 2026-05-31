import fs from 'fs';
const dts = fs.readFileSync('node_modules/@sveltejs/kit/types/index.d.ts', 'utf-8');
const lines = dts.split('\n');
const start = lines.findIndex(l => l.includes('declare module \'$app/state\''));
if (start !== -1) {
  console.log(lines.slice(start + 40, start + 80).join('\n'));
} else {
  console.log("Not found");
}
