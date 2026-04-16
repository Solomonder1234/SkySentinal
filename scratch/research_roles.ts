import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
    const mainGuild = await client.guilds.fetch('1275838044531855433');
    if (mainGuild) {
        const roles = mainGuild.roles.cache
            .filter(r => r.name.startsWith('[') || r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('founder') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('moderator'))
            .map(r => ({
                name: r.name,
                id: r.id,
                color: r.color,
                hoist: r.hoist,
                position: r.position,
                permissions: r.permissions.bitfield.toString()
            }));
        // Sort by position descending
        roles.sort((a, b) => b.position - a.position);
        fs.writeFileSync('scratch/main_staff_roles.json', JSON.stringify(roles, null, 2));
        console.log(`Research Complete: Found ${roles.length} potential staff/founder roles.`);
    } else {
        console.log('Main Guild not found');
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
