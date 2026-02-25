import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unclaim',
    description: '🔓 Remove your claim from a Modmail, Ticket, or Suggestion thread.',
    userPermissions: ['ManageMessages'],
    cooldown: 5,
    run: async (client, message, args) => {
        const channel = message.channel;
        let isClaimable = false;
        let type = '';

        if (channel.isThread()) {
            if (channel.name.match(/-(\d+)$/)) {
                isClaimable = true;
                type = 'Modmail Thread';
            }
        } else if (channel.isTextBased() && !channel.isDMBased()) {
            const name = (channel as TextChannel).name.toLowerCase();
            if (name.startsWith('ticket-')) {
                isClaimable = true;
                type = 'Support Ticket';
            } else if (name.startsWith('suggest-')) {
                isClaimable = true;
                type = 'Suggestion Ticket';
            }
        }

        if (!isClaimable) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Channel', 'You can only use `!unclaim` inside a Modmail Thread, Support Ticket, or Suggestion Ticket.')] });
        }

        const claimEmbed = new EmbedBuilder()
            .setTitle(`🔓 ${type} Unclaimed`)
            .setDescription(`This ${type.toLowerCase()} has been unclaimed by <@${message.author.id}> and is now open for any staff member to handle.`)
            .setColor(Colors.LightGrey)
            .setTimestamp();

        await message.reply({ embeds: [claimEmbed] });
    }
} as Command;
