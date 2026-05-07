const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = getFiles(path.join(__dirname, 'src'));

let processed = 0;
let modified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Remove .setAuthor(...)
    content = content.replace(/\.setAuthor\([^)]+\)/g, '');
    
    // 2. Remove .setFooter(...)
    content = content.replace(/\.setFooter\([^)]+\)/g, '');
    
    // 3. Remove .setTimestamp(...)
    content = content.replace(/\.setTimestamp\([^)]*\)/g, '');

    // 4. Overwrite any .setColor(...) with .setColor('#2B2D31')
    content = content.replace(/\.setColor\([^)]+\)/g, ".setColor('#2B2D31')");

    // Replace lingering empty lines caused by removal
    content = content.replace(/\n\s*\n/g, '\n\n');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
        console.log(`Updated ${file}`);
    }
    processed++;
}

console.log(`\nSweep complete. Processed ${processed} files, modified ${modified} files.`);
