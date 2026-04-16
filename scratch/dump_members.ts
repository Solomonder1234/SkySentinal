import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
    const guild = await client.guilds.fetch('1386826411666309201');
    if (guild) {
        const members = await guild.members.fetch();
        const data = members.map(m => ({ username: m.user.username, nickname: m.nickname, id: m.id }));
        fs.writeFileSync('scratch/staff_members.json', JSON.stringify(data, null, 2));
        console.log(`Dumped ${members.size} members.`);
    } else {
        console.log('Guild not found');
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
