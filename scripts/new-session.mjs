import fs from 'fs';
import path from 'path';

function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const title = args['--title'] || 'session';
const zone  = args['--zone']  || '';
const kind  = args['--kind']  || 'thought';

const today = new Date().toISOString().slice(0,10);
const file  = `${today}--${slugify(title)}.md`;
const dest  = path.join('docs','sessions',file);

const header = ['# ' + title, zone ? 'Zone: ' + zone : '', 'Kind: ' + kind, ''].filter(Boolean).join('\n');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, header);
console.log(dest);
