const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace paths
    content = content.replace(/\.\.\/\.\.\/css\//g, 'css/');
    content = content.replace(/\.\.\/\.\.\/js\//g, 'js/');
    content = content.replace(/\.\.\/utils\//g, 'js/');
    content = content.replace(/\.\/src\/utils\//g, './js/');

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
});
