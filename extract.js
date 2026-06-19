const fs = require('fs');
const content = fs.readFileSync('extracted.txt', 'utf8');
const m = content.match(/const IMG_[A-Z_]+\s*=\s*["'][^"']+["'];?/g);
if (m) {
  const tsContent = m.map(x => 'export ' + x.replace(/\r\n|\n|\r/g, '')).join('\n');
  fs.writeFileSync('src/utils/images.ts', tsContent);
  console.log('Extracted ' + m.length + ' images');
} else {
  console.log('No match');
}
