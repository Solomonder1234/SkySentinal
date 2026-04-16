import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const GUILD_ID = '1275838044531855433'; // SkyAlert Network
const NEW_LOG_CHANNEL = '1493661022001692794';

async function main() {
    console.log(`[Config] Updating Log Channels for Guild: ${GUILD_ID}...`);
    
    await prisma.guildConfig.update({
        where: { id: GUILD_ID },
        data: {
            enableLogging: true,
            modLogChannelId: NEW_LOG_CHANNEL,
            msgLogChannelId: NEW_LOG_CHANNEL,
            memberLogChannelId: NEW_LOG_CHANNEL,
            serverLogChannelId: NEW_LOG_CHANNEL,
            voiceLogChannelId: NEW_LOG_CHANNEL,
            joinLogChannelId: NEW_LOG_CHANNEL,
            watchLogChannelId: NEW_LOG_CHANNEL
        }
    });

    console.log(`[Success] All log slots updated to ${NEW_LOG_CHANNEL}.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
