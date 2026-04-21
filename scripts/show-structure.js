/**
 * scripts/show-structure.js
 * Run with: node scripts/show-structure.js
 *
 * Prints the VaxCare project folder structure.
 */
const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const IGNORE  = new Set(['node_modules', '.git', '.env']);

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir).filter(f => !IGNORE.has(f));
  entries.forEach((entry, i) => {
    const isLast  = i === entries.length - 1;
    const branch  = isLast ? '└── ' : '├── ';
    const child   = isLast ? '    ' : '│   ';
    const full    = path.join(dir, entry);
    const isDir   = fs.statSync(full).isDirectory();
    console.log(prefix + branch + entry + (isDir ? '/' : ''));
    if (isDir) walk(full, prefix + child);
  });
}

console.log('\nVaxCare Project Structure\n=========================');
walk(ROOT);
console.log('');
