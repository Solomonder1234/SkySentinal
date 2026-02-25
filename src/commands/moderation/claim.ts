import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'claim',
    description: '✋ Claim a Modmail, Ticket, or Suggestion thread.',
    userPermissions: ['ManageMessages'],
    cooldown: 5,
    run: async (client, message, args) => {
        const channel = message.channel;
        let isClaimable = false;
        let type = '';

        if (channel.isThread()) {
            // Modmail check
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
            return message.reply({ embeds: [EmbedUtils.error('Invalid Channel', 'You can only use `!claim` inside a Modmail Thread, Support Ticket, or Suggestion Ticket.')] });
        }

        const claimEmbed = new EmbedBuilder()
            .setTitle(`✋ ${type} Claimed`)
            .setDescription(`This ${type.toLowerCase()} has been officially claimed by <@${message.author.id}>.\nThey will be taking the lead on this request.`)
            .setColor(Colors.Orange)
            .setTimestamp();

        const msg = await message.reply({ embeds: [claimEmbed] });
        await msg.pin().catch(() => { });
    }
} as Command;
