// Lists every "[FILL IN: …]" placeholder in the content, grouped by topic,
// and writes them to FILL-IN-CHECKLIST.md. Run: npm run fillins
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('content/topics');
const out = ['# [FILL IN] checklist', '', 'Your real details are needed in these places. Edit the topic file, replace the whole `[FILL IN: …]` with the true detail, or delete the sentence if it does not apply.', ''];
let total = 0;

const files = fs.readdirSync(root, { recursive: true }).filter((f) => f.endsWith('.md')).sort();
// resume pages first — they matter most
files.sort((a, b) => (b.startsWith('resume') - a.startsWith('resume')) || a.localeCompare(b));

for (const rel of files) {
  const lines = fs.readFileSync(path.join(root, rel), 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\[FILL IN:([^\]]*)\]/g)) hits.push(`- [ ] line ${i + 1}: ${m[1].trim()}`);
  });
  if (!hits.length) continue;
  total += hits.length;
  out.push(`## ${rel.replace(/\\/g, '/')} (${hits.length})`, '', ...hits, '');
}

out.splice(3, 0, `**${total} items.**`, '');
fs.writeFileSync('FILL-IN-CHECKLIST.md', out.join('\n'));
console.log(`FILL-IN-CHECKLIST.md written: ${total} items`);
