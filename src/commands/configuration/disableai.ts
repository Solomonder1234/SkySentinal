import { Events, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'disableai',
    description: 'Disables all AI moderation in this server.',
    category: 'Configuration',
    prefixOnly: true,
    defaultMemberPermissions: 'Administrator',
    aliases: ['turnoffai'],
    run: async (client, message, args) => {
        if (!message.guildId) return;

        const config = await client.database.prisma.guildConfig.upsert({
            where: { id: message.guildId },
            update: { aiEnabled: false },
            create: { id: message.guildId, aiEnabled: false }
        });

        await message.reply({ embeds: [EmbedUtils.error('AI Core Shutdown', `All primary artificial intelligence functionality has been forcefully terminated for **${message.guild?.name}**.\n\n- AI Chat Routing: **OFF**\n- Vision Guard Scanner: **OFF**\n- Text Toxicity Engine: **OFF**\n\nThe bot is now fully manual. Use \`!enableai\` to restore neural networks.`)] });
    }
} as Command;
