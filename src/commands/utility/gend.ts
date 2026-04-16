import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'gend',
    description: 'Forces an active giveaway to end immediately.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        const messageId = args[0] || '';
        if (!messageId) {
            return message.reply({ embeds: [EmbedUtils.error('Missing ID', 'Please provide the Message ID of the active giveaway.')] });
        }

        try {
            await client.giveaways.endGiveaway(messageId);
            await message.react('✅').catch(() => null);
        } catch (err: any) {
            await message.reply(`❌ Failed to end giveaway: ${err.message}`);
        }
    }
} as Command;
