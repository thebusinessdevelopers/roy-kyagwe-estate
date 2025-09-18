import { spawnSync } from 'child_process';

const msgFlag = process.argv.find(a => a.startsWith('--m='));
const msg = msgFlag ? msgFlag.slice(4) : `docs: save @ ${new Date().toISOString()}`;

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('git', ['add', 'docs', 'bmad-core']);
const diff = spawnSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' });
if (!diff.stdout.trim()) {
  console.log('No staged changes under docs/ or bmad-core/. Pushing anyway to trigger CI if needed.');
} else {
  run('git', ['commit', '-m', msg]);
}
run('git', ['push', 'origin', 'main']);
console.log('✓ pushed. GitHub Action will sync to Supabase.');
