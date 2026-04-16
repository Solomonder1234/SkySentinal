import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = '1492286100532887593';
const STAFF_INVITE = 'https://discord.gg/URd5UBJ3Wz';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`[Script] Authenticated as ${client.user?.tag}`);
    
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel && channel.isTextBased()) {
            const textChannel = channel as any;
            const embed = new EmbedBuilder()
                .setTitle('⚖️ Official Staff Server Access')
                .setThumbnail('https://i.imgur.com/xO7963C.png') // SkySentinel Icon
                .setColor('#2F3136')
                .setDescription(
                    `All active staff personnel are **required** to be present in the official SkyAlert Staff Network.\n\n` +
                    `⚠️ **MANDATORY NOTICE:**\nYou will be fired within a week if you are **NOT IN** the server.\n\n` +
                    `🔗 **Access Link:** ${STAFF_INVITE}`
                )
                .setFooter({ text: 'SkySentinel Automated Logistics' })
                .setTimestamp();

            await textChannel.send({ 
                embeds: [embed] 
            });
            console.log(`[Success] Staff invite posted to ${CHANNEL_ID}`);
        } else {
            console.error(`[Error] Channel ${CHANNEL_ID} not found or not text-based.`);
        }
    } catch (err) {
        console.error('[Error] Failed to send message:', err);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(TOKEN);
