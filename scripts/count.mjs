import fs from 'fs'; import path from 'path';
const roots = ['docs','bmad-core']; const exts = new Set(['.md','.markdown','.yml','.yaml']);
let count = 0;
function walk(d){ if(!fs.existsSync(d)) return;
  for(const n of fs.readdirSync(d)){ const f=path.join(d,n); const s=fs.statSync(f);
    if(s.isDirectory()) walk(f); else if(exts.has(path.extname(f))) count++;
  }
}
roots.forEach(walk);
console.log(JSON.stringify({ total: count }, null, 2));
