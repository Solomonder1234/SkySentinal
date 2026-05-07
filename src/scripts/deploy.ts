import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const commands: any[] = [];

// Helper to convert BigInts to strings recursively
function serialize(obj: any): any {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(serialize);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = serialize(obj[key]);
        }
        return newObj;
    }
    return obj;
}

const commandsPath = path.join(__dirname, '../commands');

function getFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files.push(...getFiles(path.join(dir, item.name)));
        } else if ((item.name.endsWith('.ts') || item.name.endsWith('.js')) && !item.name.endsWith('.d.ts')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
}

const commandFiles = getFiles(commandsPath);

for (const file of commandFiles) {
    try {
        const command = require(file).default;
        // Discord places a hard limit on global/guild slash commands (100).
        // Since the bot has 164 commands, we must filter out non-essential 
        // slash commands and leave them as prefix-only.
        const essentialCategories = ['admin', 'configuration', 'moderation', 'utility'];
        const isEssential = essentialCategories.some(cat => file.includes(`/${cat}/`));

        if (command && command.name && (!command.prefixOnly && isEssential)) {
            const apiCommand = {
                name: command.name,
                description: command.description,
                options: command.options,
                type: command.type,
                default_member_permissions: command.defaultMemberPermissions?.toString(),
                dm_permission: command.dmPermission,
                nsfw: command.nsfw
            };
            commands.push(serialize(apiCommand));
        }
    } catch (e) {
        console.error(`Error loading command file ${file}:`, e);
    }
}

const tokenVal = process.env.DISCORD_TOKEN;
if (!tokenVal) {
    console.error('DISCORD_TOKEN is missing from .env');
    process.exit(1);
}
const rest = new REST({ version: '10' }).setToken(tokenVal);

const guildId = process.env.GUILD_ID;
let clientId = process.env.CLIENT_ID;

if (!clientId && tokenVal) {
    try {
        const idPart = tokenVal.split('.')[0];
        if (idPart) {
            clientId = Buffer.from(idPart, 'base64').toString();
            console.log(`Extracted Client ID from token: ${clientId}`);
        }
    } catch (e) {
        console.error('Failed to extract Client ID from token:', e);
    }
}

if (!clientId) {
    console.error('CLIENT_ID not found and could not be extracted.');
    process.exit(1);
}

(async () => {
    console.log(`Deploying ${commands.length} commands...`);

    try {
        if (guildId) {
            console.log('Clearing global commands just in case to prevent duplicates...');
            await rest.put(Routes.applicationCommands(clientId!), { body: [] });

            console.log('Deploying to guild...');
            await rest.put(
                Routes.applicationGuildCommands(clientId!, guildId),
                { body: commands }
            );
        } else {
            console.log('Deploying globally...');
            await rest.put(
                Routes.applicationCommands(clientId!),
                { body: commands }
            );
        }
        console.log('✅ All commands processed successfully.');
    } catch (error: any) {
        console.error(`❌ FAILED to deploy commands`);
        if (error.rawError) {
            console.error('API Error Details:', JSON.stringify(error.rawError, null, 2));
        } else {
            console.error('An error occurred:', error);
        }
        process.exit(1);
    }
})();
