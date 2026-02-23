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

// Points to src/commands from src/scripts
const commandsPath = path.join(__dirname, '../commands');

function getFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files.push(...getFiles(path.join(dir, item.name)));
        } else if (item.name.endsWith('.ts') || item.name.endsWith('.js')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
}

const commandFiles = getFiles(commandsPath);

for (const file of commandFiles) {
    const command = require(file).default;
    if (command && command.name && !command.prefixOnly) {
        commands.push(serialize(command));
    }
}

const tokenVal = process.env.DISCORD_TOKEN;
if (!tokenVal) {
    console.error('DISCORD_TOKEN is missing from .env');
    process.exit(1);
}
const rest = new REST({ version: '10' }).setToken(tokenVal);

(async () => {
    try {
        console.log(`Transitioning to ! ONLY mode. Clearing ${commands.length} application (/) commands.`);
        const clearCommands: any[] = []; // Empty array to clear discord commands

        let clientId = process.env.CLIENT_ID;
        const token = process.env.DISCORD_TOKEN;

        if (!clientId && token) {
            try {
                const idPart = token.split('.')[0];
                if (idPart) {
                    clientId = Buffer.from(idPart, 'base64').toString();
                    console.log(`Extracted Client ID from token: ${clientId}`);
                }
            } catch (e) {
                console.error('Failed to extract Client ID from token:', e);
            }
        }

        const guildId = process.env.GUILD_ID;

        if (guildId && clientId) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: clearCommands },
            );
            console.log(`Successfully reloaded ${commands.length} application (/) commands for guild ${guildId}.`);
        } else if (clientId) {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: clearCommands },
            );
            console.log(`Successfully reloaded ${commands.length} application (/) commands globally.`);
        } else {
            console.warn('Skipping command deployment: CLIENT_ID not set in .env and could not be extracted from token.');
        }

    } catch (error: any) {
        // Detailed error logging
        if (error.rawError) {
            console.error('API Error Details:', JSON.stringify(error.rawError, null, 2));
        } else {
            console.error('An error occurred:', error);
        }
    }
})();
