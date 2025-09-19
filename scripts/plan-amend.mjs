import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

function now(){ return new Date().toISOString().replace('T',' ').slice(0,19); }
function sectionRegex(name){
  const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s*${n}(?:\\s*—.*)?\\s*$`, 'im'); // case-insensitive, multiline
}
function applyInMemory(text, { section, mode='append', content }){
  const lines = text.split('\n');
  const re = sectionRegex(section);

  // find last heading occurrence
  let lastIdx = -1;
  for (let i=0;i<lines.length;i++){ if (re.test(lines[i])) lastIdx = i; }

  const blockHeader = `## ${section} — ${now()}`;

  if (lastIdx === -1){
    // create section at end
    const newText = (text.trimEnd() + '\n\n' + blockHeader + '\n' + content.trimEnd() + '\n');
    return newText;
  }

  // find end of current section (next "## " or EOF)
  let endIdx = lines.length;
  for (let j=lastIdx+1;j<lines.length;j++){ if (/^##\s+/i.test(lines[j])) { endIdx = j; break; } }

  if (mode === 'append'){
    const injected = [blockHeader, content.trimEnd()].join('\n');
    const before = lines.slice(0, endIdx).join('\n');
    const after  = lines.slice(endIdx).join('\n');
    const newText = (before + '\n' + injected + '\n' + (after ? '\n' + after : '')).replace(/\n{3,}/g,'\n\n');
    return newText;
  }

  if (mode === 'replace'){
    const headerLine = lines[lastIdx].startsWith('## ') ? lines[lastIdx] : blockHeader;
    const newLines = [
      ...lines.slice(0, lastIdx),
      headerLine,
      content.trimEnd(),
      ...lines.slice(endIdx)
    ];
    const newText = newLines.join('\n').replace(/\n{3,}/g,'\n\n');
    return newText;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

function parseArgs(argv){
  const out={};
  for(const a of argv){ const i=a.indexOf('='); if(i>0) out[a.slice(0,i)]=a.slice(i+1); }
  return out;
}

function diffText(before, after, displayPath){
  // write temp files and call git diff --no-index
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kyagwe-'));
  const a = path.join(dir, 'before.md');
  const b = path.join(dir, 'after.md');
  fs.writeFileSync(a, before);
  fs.writeFileSync(b, after);
  const r = spawnSync('git', ['--no-pager','diff','--no-index','--unified=3','--no-color','--', a, b], { encoding: 'utf8' });
  const header = `\n===== DIFF: ${displayPath} =====\n`;
  return header + (r.stdout || '(no diff)') + '\n';
}

function normalizeFile(f){
  // allow passing just the session filename
  return f.startsWith('docs/') ? f : path.join('docs','sessions',f);
}

function readOpsFromArgs(args){
  if (args['--ops']){
    const ops = JSON.parse(fs.readFileSync(args['--ops'],'utf-8'));
    return ops.map(o => ({
      file: normalizeFile(o.file),
      section: o.section,
      mode: o.mode || 'append',
      content: o.content ?? (o.content_from ? fs.readFileSync(o.content_from,'utf-8') : '')
    }));
  }
  const session = args['--session']; const section = args['--section'];
  if (!session || !section) {
    console.error('Usage (single): npm run plan -- --session=<file.md> --section=<name> [--mode=append|replace] <<TEXT');
    console.error('Usage (batch) : npm run plan -- --ops=ops.json');
    process.exit(1);
  }
  const content = fs.readFileSync(0,'utf-8'); // stdin
  return [{ file: normalizeFile(session), section, mode: args['--mode'] || 'append', content }];
}

function groupByFile(ops){
  const map = new Map();
  for(const op of ops){
    if(!map.has(op.file)) map.set(op.file, []);
    map.get(op.file).push(op);
  }
  return map;
}

function main(){
  const args = parseArgs(process.argv.slice(2));
  const ops  = readOpsFromArgs(args);
  const groups = groupByFile(ops);

  let changed = 0;
  for(const [file, list] of groups){
    if (!fs.existsSync(file)) { console.error(`Missing: ${file}`); continue; }
    const before = fs.readFileSync(file,'utf-8');
    let after = before;
    for(const op of list){ after = applyInMemory(after, op); }
    if (after !== before){
      changed++;
      process.stdout.write(diffText(before, after, file));
    }
  }
  console.log(JSON.stringify({ files_considered: groups.size, files_with_changes: changed }, null, 2));
}
main();
