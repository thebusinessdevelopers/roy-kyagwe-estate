import fs from 'fs'; import path from 'path';
function now(){ return new Date().toISOString().replace('T',' ').slice(0,19); }
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const session = args['--session']; if (!session){ console.error('Provide --session'); process.exit(1); }
const scope = args['--scope'] || 'TBD';
const tests = (args['--tests'] || '').split(';;').filter(Boolean).map(s=>`- ${s.trim()}`).join('\n');
const dest = path.join('docs','sessions', session);
const block = `\n## GREENLIGHT — ${now()}\n**Scope:** ${scope}\n**Acceptance tests:**\n${tests || '- TBD'}\n`;
fs.appendFileSync(dest, block); console.log(dest);
