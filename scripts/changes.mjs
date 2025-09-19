import { spawnSync } from 'child_process';

function run(args){ return spawnSync('git', args, { encoding: 'utf8' }); }
function print(title, out){ if (out.trim()) { console.log(`\n# ${title}\n` + out.trim() + '\n'); } }

const unstagedNames = run(['--no-pager','diff','--name-status','--','docs','bmad-core']).stdout;
const unstagedStat  = run(['--no-pager','diff','--stat','--','docs','bmad-core']).stdout;

const stagedNames   = run(['--no-pager','diff','--cached','--name-status','--','docs','bmad-core']).stdout;
const stagedStat    = run(['--no-pager','diff','--cached','--stat','--','docs','bmad-core']).stdout;

if (!unstagedNames.trim() && !stagedNames.trim()){
  console.log('No changes under docs/ or bmad-core/.');
  process.exit(0);
}

print('Unstaged (working tree)', unstagedNames || '(none)');
print('Unstaged summary',        unstagedStat  || '(none)');
print('Staged (index)',          stagedNames   || '(none)');
print('Staged summary',          stagedStat    || '(none)');
