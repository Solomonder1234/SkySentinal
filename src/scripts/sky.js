const fs = require('fs');
const path = require('path');

const command = process.argv.slice(2).join(' ');

if (!command) {
    console.error('Usage: npm run sky -- <command>');
    process.exit(1);
}

const pipePath = path.join(process.cwd(), '.sky_pipe');

if (!fs.existsSync(pipePath)) {
    console.error('Error: Bot is not running or terminal pipe is inactive.');
    process.exit(1);
}

try {
    fs.writeFileSync(pipePath, command);
    console.log(`Command sent to SkySentinel: ${command}`);
} catch (e) {
    console.error('Failed to send command:', e.message);
    process.exit(1);
}
