import fs from 'fs'; import path from 'path';
const dir='docs/sessions'; if(!fs.existsSync(dir)){ console.log('No sessions'); process.exit(0); }
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.md')).sort().reverse();
for(const f of files.slice(0,20)){ console.log(f); }
