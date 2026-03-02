import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel, Client } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'close',
    description: '🔐 Formal Modmail closure for the current thread.',
    aliases: ['mmclose'],
    cooldown: 5,
    run: async (client, message, args) => {
        const channel = message.channel as TextChannel | ThreadChannel;
        const match = channel.name.match(/mm-(\d+)$/) || (channel.isThread() ? channel.name.match(/-(\d+)$/) : null);

        if (!match || !match[1]) {
            return message.reply({ embeds: [EmbedUtils.error('Modmail Error', 'You can only use this command inside an active Modmail Thread or Channel.')] });
        }

        const userId = match[1];
        const reason = args.join(' ') || 'No specific reason provided.';

        const targetUser = await client.users.fetch(userId).catch(() => null);

        if (targetUser) {
            const closeEmbed = new EmbedBuilder()
                .setTitle('🔒 Modmail Thread Closed')
                .setDescription(`Your support thread with **${message.guild?.name}** has been formally closed by the staff team.`)
                .addFields({ name: 'Reason / Final Notes', value: reason })
                .setColor(Colors.Red)
                .setTimestamp();

            await targetUser.send({ embeds: [closeEmbed] }).catch(() => { });
        }

        await message.reply({ embeds: [EmbedUtils.success('Modmail Closed', `The Modmail session has been ended. Reason relayed to user: \`${reason}\``)] });

        if (message.channel.isThread()) {
            await (message.channel as ThreadChannel).setArchived(true);
        } else {
            // Delete text channel after a 5 second delay to let the staff see the confirmation
            setTimeout(() => message.channel.delete().catch(() => { }), 5000);
        }
    }
} as Command;
