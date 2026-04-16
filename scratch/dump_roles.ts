import { PrismaClient } from '@prisma/client';
import { Client, GatewayIntentBits, Role } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
    const guild = client.guilds.cache.get('1386826411666309201');
    if (!guild) {
        console.error('Guild not found');
        process.exit(1);
    }

    const roles = guild.roles.cache.map(r => ({ name: r.name, id: r.id }));
    console.log(JSON.stringify(roles, null, 2));
    process.exit(0);
});

client.login(process.env.TOKEN);
