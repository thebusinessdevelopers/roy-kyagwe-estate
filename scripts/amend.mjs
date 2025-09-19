import fs from 'fs';
import path from 'path';

function now() { return new Date().toISOString().replace('T',' ').slice(0,19); }

function readStdin() {
  return new Promise(res => {
    let s = ''; process.stdin.on('data', d => s += d);
    process.stdin.on('end', () => res(s));
  });
}

function sectionRegex(name) {
  // Matches lines like: "## options" or "## options — 2025-09-18 12:00:00"
  const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s*${n}(?:\\s*—.*)?\\s*$`, 'im');
}

function applyOne({ file, section, mode='append', content, dry=false }) {
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
  const original = fs.readFileSync(file, 'utf-8');
  const re = sectionRegex(section);
  const lines = original.split('\n');

  // Find last heading match index
  let lastIdx = -1;
  for (let i=0; i<lines.length; i++) {
    if (re.test(lines[i])) lastIdx = i;
  }

  const blockHeader = `## ${section} — ${now()}`;
  if (lastIdx === -1) {
    // Section not present: create at end (blank line ensured)
    const newText = (original.trimEnd() + '\n\n' + blockHeader + '\n' + content.trimEnd() + '\n');
    if (dry) return { file, mode, createdSection: true, changed: newText };
    fs.writeFileSync(file, newText);
    return { file, mode, createdSection: true, changed: true };
  }

  // Determine end of current section (next "## " or EOF)
  let endIdx = lines.length;
  for (let j = lastIdx + 1; j < lines.length; j++) {
    if (/^##\s+/i.test(lines[j])) { endIdx = j; break; }
  }

  if (mode === 'append') {
    const injected = [blockHeader, content.trimEnd()].join('\n');
    const before = lines.slice(0, endIdx).join('\n');
    const after  = lines.slice(endIdx).join('\n');
    const newText = (before + '\n' + injected + '\n' + (after ? '\n' + after : '')).replace(/\n{3,}/g, '\n\n');
    if (dry) return { file, mode, createdSection: false, changed: newText };
    fs.writeFileSync(file, newText);
    return { file, mode, createdSection: false, changed: true };
  }

  if (mode === 'replace') {
    // Replace the *last* block's body (keep its heading line if it already has a timestamp)
    // Find the heading line we will keep at lastIdx; replace everything until endIdx with new heading+content
    const headerLine = lines[lastIdx].startsWith('## ') ? lines[lastIdx] : blockHeader;
    const newBlock = [headerLine, content.trimEnd()].join('\n');
    const newLines = [
      ...lines.slice(0, lastIdx),
      newBlock,
      ...lines.slice(endIdx)
    ];
    const newText = newLines.join('\n').replace(/\n{3,}/g, '\n\n');
    if (dry) return { file, mode, createdSection: false, changed: newText };
    fs.writeFileSync(file, newText);
    return { file, mode, createdSection: false, changed: true };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const i = a.indexOf('=');
    if (i > 0) out[a.slice(0,i)] = a.slice(i+1);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = args['--dry'] === '1' || process.env.DRY === '1';

  if (args['--ops']) {
    const opsPath = args['--ops'];
    const ops = JSON.parse(fs.readFileSync(opsPath, 'utf-8'));
    let applied = 0, preview = [];
    for (const op of ops) {
      const file = op.file.startsWith('docs/') ? op.file : path.join('docs','sessions', op.file);
      const res = applyOne({
        file,
        section: op.section,
        mode: op.mode || 'append',
        content: op.content ?? (op.content_from ? fs.readFileSync(op.content_from,'utf-8') : ''),
        dry
      });
      if (dry && res.changed && typeof res.changed === 'string') {
        preview.push({ file, bytes: res.changed.length });
        process.stdout.write(`\n--- DRY PREVIEW: ${file} ---\n` + res.changed + '\n');
      } else {
        applied++;
      }
    }
    if (dry) {
      console.log(JSON.stringify({ dry:true, previews: preview }, null, 2));
    } else {
      console.log(JSON.stringify({ applied }, null, 2));
    }
    return;
  }

  // single-op mode
  const session = args['--session'] || '';
  const file    = args['--file'] || (session ? path.join('docs','sessions', session) : '');
  const section = args['--section'];
  const mode    = args['--mode'] || 'append';
  if (!file || !section) {
    console.error('Usage: npm run amend -- --session=<file.md> --section=<name> [--mode=append|replace] [--dry=1] <<TEXT');
    process.exit(1);
  }
  const content = await readStdin();
  const res = applyOne({ file, section, mode, content, dry });
  if (dry && res.changed && typeof res.changed === 'string') {
    process.stdout.write(res.changed);
  } else {
    console.log(JSON.stringify(res, null, 2));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
