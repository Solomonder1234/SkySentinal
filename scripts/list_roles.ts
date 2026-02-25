import { Client, GatewayIntentBits } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envFile.match(/DISCORD_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once('ready', async () => {
    console.log(`Diagnostic script logged in as ${client.user?.tag}!`);

    const MAIN = await client.guilds.fetch('1275838044531855433').catch(() => null);
    const STAFF = await client.guilds.fetch('1386826411666309201').catch(() => null);

    console.log('--- MAIN SERVER ROLES ---');
    if (MAIN) {
        const roles = await MAIN.roles.fetch();
        roles.forEach(r => console.log(`${r.name} -> ${r.id}`));
    } else {
        console.log('Could not fetch Main server.');
    }

    console.log('\n--- STAFF SERVER ROLES ---');
    if (STAFF) {
        const roles = await STAFF.roles.fetch();
        roles.forEach(r => console.log(`${r.name} -> ${r.id}`));
    } else {
        console.log('Could not fetch Staff server.');
    }

    process.exit(0);
});

client.login(token);
