import { spawnSync } from 'child_process';

const run = (cmd, args) => { const r = spawnSync(cmd, args, { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status ?? 1); };
const msgFlag = process.argv.find(a => a.startsWith('--m=')); const msg = msgFlag ? msgFlag.slice(4) : `docs: save @ ${new Date().toISOString()}`;

// 1) Rebuild File Library
run('node', ['scripts/build-file-library.mjs']);

// 2) Stage docs + bmad-core and commit (empty commit if nothing changed)
run('git', ['add', 'docs', 'bmad-core']);
const diff = spawnSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' });
if (!diff.stdout.trim()) {
  console.log('No staged changes under docs/ or bmad-core/. Creating empty commit to trigger CI.');
  run('git', ['commit', '--allow-empty', '-m', msg]);
} else {
  run('git', ['commit', '-m', msg]);
}
run('git', ['push', 'origin', 'main']);
console.log('✓ pushed. GitHub Action will sync to Supabase.');
