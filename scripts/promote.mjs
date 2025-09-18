import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const args = Object.fromEntries(process.argv.slice(2).map(a=>a.split('=')));
const src = args['--src']; const name = args['--name'] || path.basename(src);
const kind = args['--kind'] || 'config'; const notes = args['--notes'] || '';
if(!src || !fs.existsSync(src)){ console.error('Usage: npm run promote -- --src=artefacts/work/file.json [--name=name] [--kind=n8n|python|config] [--notes="..."]'); process.exit(1); }
const data = fs.readFileSync(src); const sha = crypto.createHash('sha256').update(data).digest('hex');
const ext = path.extname(src) || '.json';
const dest = path.join('artefacts','validated', name.endsWith(ext)? name : name+ext);
fs.copyFileSync(src, dest);
const idxPath = path.join('artefacts','validated','index.json');
const idx = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath,'utf-8')) : { items: [] };
const prev = idx.items.find(i=>i.name===name);
const version = prev ? prev.version+1 : 1;
const rec = { name, kind, path: dest, sha256: sha, version, updated_at: new Date().toISOString(), notes };
idx.items = idx.items.filter(i=>i.name!==name).concat([rec]);
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2));
console.log(`promoted ${src} -> ${dest} v${version}`);
