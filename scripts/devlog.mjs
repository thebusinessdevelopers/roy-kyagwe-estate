import fs from 'fs'; import path from 'path';
function now(){ return new Date().toISOString().replace('T',' ').slice(0,19); }
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const session=args['--session']; if(!session){ console.error('Provide --session'); process.exit(1); }
const step=args['--step']||'step'; const expected=args['--expected']||''; const actual=args['--actual']||''; const result=args['--result']||'pending';
const dest=path.join('docs','sessions',session);
const block = `\n## DEV LOG — ${now()}\n**Step:** ${step}\n**Expected:** ${expected}\n**Actual:** ${actual}\n**Result:** ${result}\n`;
fs.appendFileSync(dest, block); console.log(dest);
