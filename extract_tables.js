const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('src');
const fromSet = new Set();
const rpcSet = new Set();
const storageSet = new Set();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const fromMatches = [...content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)];
  fromMatches.forEach(m => fromSet.add(m[1]));
  
  const rpcMatches = [...content.matchAll(/\.rpc\(['"]([^'"]+)['"]\)/g)];
  rpcMatches.forEach(m => rpcSet.add(m[1]));
  
  const storageMatches = [...content.matchAll(/\.storage\.from\(['"]([^'"]+)['"]\)/g)];
  storageMatches.forEach(m => storageSet.add(m[1]));
});

console.log("FROM:", Array.from(fromSet));
console.log("RPC:", Array.from(rpcSet));
console.log("STORAGE:", Array.from(storageSet));
