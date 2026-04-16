
import fs from 'fs';
import path from 'path';

const commandsDir = path.join(process.cwd(), 'src', 'commands');

function walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk(commandsDir);

for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    
    // Simple regex to find name and description
    const nameMatch = content.match(/name:\s*['"`](.*?)['"Primitive]/);
    const descMatch = content.match(/description:\s*['"`](.*?)['"Primitive]/);
    
    if (nameMatch && nameMatch[1].length > 32) {
        console.log(`[NAME TOO LONG] ${file}: ${nameMatch[1].length}`);
    }
    if (descMatch && descMatch[1].length > 100) {
        console.log(`[DESC TOO LONG] ${file}: ${descMatch[1].length}`);
    }
}
