import fs from 'fs';
import path from 'path';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const i = a.indexOf('=');
    return [a.slice(0, i), a.slice(i + 1)];
  })
);

const file   = args['--session'];
if (!file) { console.error('Provide --session'); process.exit(1); }

const title  = args['--title']  || 'Decision';
const why    = args['--why']    || '';
const status = args['--status'] || 'proposed';
const tests  = (args['--tests']  || '')
  .split(';;')
  .filter(Boolean)
  .map(s => `- ${s.trim()}`)
  .join('\n');

const dest  = path.join('docs','sessions', file);
const block = `

## DECISION
- **What:** ${title}
- **Why:** ${why}
- **Status:** ${status}
- **Acceptance tests:**
${tests || '- TBD'}
`;

fs.appendFileSync(dest, block);
console.log(dest);
