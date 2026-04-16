import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'greroll',
    description: 'Rerolls a new winner for a completed giveaway.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        const messageId = args[0] || '';
        if (!messageId) {
            return message.reply({ embeds: [EmbedUtils.error('Missing ID', 'Please provide the Message ID of the completed giveaway.')] });
        }

        try {
            const winner = await client.giveaways.rerollGiveaway(messageId);
            if (!winner) {
                return message.reply({ embeds: [EmbedUtils.error('Reroll Failed', 'I could not find that giveaway, or there are no valid entries to reroll from.')] });
            }
            await message.react('🎲').catch(() => null);
        } catch (err: any) {
            await message.reply(`❌ Failed to reroll: ${err.message}`);
        }
    }
} as Command;
