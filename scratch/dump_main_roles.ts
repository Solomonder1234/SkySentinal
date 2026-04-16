import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get('1275838044531855433');
    if (guild) {
        const roles = guild.roles.cache.map(r => ({ name: r.name, id: r.id }));
        console.log(JSON.stringify(roles, null, 2));
    } else {
        console.log('Main Guild not found');
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
