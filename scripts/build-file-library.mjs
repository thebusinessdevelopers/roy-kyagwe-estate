import fs from 'fs'; import path from 'path';

const out = 'docs/file-library.md';
const now = new Date().toISOString();

const asMDLink = (p, label) => `- [${label}](${p})`;
const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf-8') : '';
const stat = p => fs.existsSync(p) ? fs.statSync(p) : null;

function listSessions(){
  const dir = 'docs/sessions';
  if(!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.md'));
  return files.map(f=>{
    const p = path.join(dir,f);
    const txt = read(p);
    const title = (txt.match(/^#\s+(.+)$/m)||[])[1] || f;
    const zone = (txt.match(/^Zone:\s*(.+)$/m)||[])[1] || '';
    const kind = (txt.match(/^Kind:\s*(.+)$/m)||[])[1] || '';
    const green = /##\s*GREENLIGHT/i.test(txt);
    const m = stat(p)?.mtime?.toISOString() || '';
    return { f, p, title, zone, kind, green, m };
  }).sort((a,b)=>b.f.localeCompare(a.f)); // newest first by filename prefix (YYYY-MM-DD)
}

function list(dir, exts){
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>exts.some(e=>f.endsWith(e)))
    .map(f=>({ f, p: path.join(dir,f), m: stat(path.join(dir,f))?.mtime?.toISOString()||'' }))
    .sort((a,b)=>a.f.localeCompare(b.f));
}

function listArtefacts(){
  const idx = 'artefacts/validated/index.json';
  if(!fs.existsSync(idx)) return { items: [] };
  try { return JSON.parse(read(idx)); } catch { return { items: [] }; }
}

const sessions   = listSessions();
const agents     = list('bmad-core/agents', ['.md']);
const templates  = list('bmad-core/templates', ['.yaml','.yml']);
const artefacts  = listArtefacts();

const lines = [];
lines.push('# Kyagwe File Library (auto-generated)');
lines.push(`Updated: ${now}`);
lines.push('');
lines.push('## How to use this library');
lines.push('- **sessions/** — living notes. Use sections: *facts*, *options*, *decision*, *actions*.');
lines.push('- **GREENLIGHT** — the only signal that work can move to **dev**.');
lines.push('- **bmad-core/agents/** — prompts that drive “partner” and “dev”. Paste these into Cursor/Claude agent profiles.');
lines.push('- **bmad-core/templates/** — checklists and session scaffolds; reference while logging.');
lines.push('- **artefacts/validated/** — last known-good configs (n8n nodes, JSON, etc.). Promote only when tests pass.');
lines.push('');
lines.push('## Sessions (newest first)');
if (sessions.length===0) lines.push('_None yet_');
for (const s of sessions){
  const bits = [];
  if(s.kind) bits.push(`kind: ${s.kind}`);
  if(s.zone) bits.push(`zone: ${s.zone}`);
  bits.push(`updated: ${s.m.slice(0,10)}`);
  bits.push(s.green ? 'GREENLIGHT: ✅' : 'GREENLIGHT: —');
  lines.push(`- ${s.f.slice(0,10)} — [${s.title}](${s.p}) — ${bits.join(' · ')}`);
}
lines.push('');
lines.push('## Agents');
if (agents.length===0) lines.push('_None_');
for (const a of agents){
  const title = a.f.replace(/[-_]/g,' ').replace(/\.(md)$/,'');
  lines.push(asMDLink(a.p, title));
}
lines.push('');
lines.push('## Templates');
if (templates.length===0) lines.push('_None_');
for (const t of templates){
  lines.push(asMDLink(t.p, t.f));
}
lines.push('');
lines.push('## Artefacts (validated — last known good)');
if (!artefacts.items || artefacts.items.length===0) {
  lines.push('_None promoted yet_');
} else {
  for (const item of artefacts.items.sort((a,b)=>a.name.localeCompare(b.name))){
    lines.push(`- ${item.name} v${item.version} (${item.kind}) — ${item.notes||''} — \`${item.path}\``);
  }
}
lines.push('');
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out}`);
