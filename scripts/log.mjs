import fs from 'fs';
import path from 'path';

function now(){ return new Date().toISOString().replace('T',' ').slice(0,19); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const session = args['--session'] || '';           // e.g. 2025-09-18--irrigation-pilot-scoping
const title   = args['--title']   || '';           // if no --session, we derive it from title + today
const section = (args['--section'] || 'notes').toUpperCase();
const zone    = args['--zone'] || '';
const kind    = args['--kind'] || 'thought';

if (!session && !title) { console.error('Provide --session or --title'); process.exit(1); }

const today = new Date().toISOString().slice(0,10);
const filename = session || `${today}--${slug(title)}.md`;
const dest = path.join('docs','sessions', filename);

const stdin = await new Promise(r => { let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>r(s)); });
const header = `# ${title || filename.split('--')[1].replace(/-/g,' ')}\n${zone?`Zone: ${zone}\n`:''}Kind: ${kind}\n\n`;
const block = `\n## ${section} — ${now()}\n${stdin.trim()}\n`;

fs.mkdirSync(path.dirname(dest), { recursive: true });
if (!fs.existsSync(dest)) fs.writeFileSync(dest, header);
fs.appendFileSync(dest, block);
console.log(dest);
