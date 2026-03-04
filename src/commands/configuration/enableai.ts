import { Events, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'enableai',
    description: 'Restores all AI functionality in the server (Chat, Vision Guard, Toxicity Filtering).',
    category: 'Configuration',
    defaultMemberPermissions: 'Administrator',
    aliases: ['startai'],
    run: async (client, message, args) => {
        if (!message.guildId) return;

        const config = await client.database.prisma.guildConfig.upsert({
            where: { id: message.guildId },
            update: { aiEnabled: true },
            create: { id: message.guildId, aiEnabled: true }
        });

        await message.reply({ embeds: [EmbedUtils.success('AI Core Online', `All primary artificial intelligence functionality has been restored for **${message.guild?.name}**.\n\n- AI Chat Routing: **ON**\n- Vision Guard Scanner: **ON**\n- Text Toxicity Engine: **ON**\n\nThe bot is actively monitoring parameters again.`)] });
    }
} as Command;
