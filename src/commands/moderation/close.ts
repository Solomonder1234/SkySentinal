import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel, Client } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'close',
    description: '🔐 Formal Modmail closure for the current thread.',
    aliases: ['mmclose'],
    cooldown: 5,
    run: async (client, message, args) => {
        if (!message.channel.isThread()) {
            return message.reply({ embeds: [EmbedUtils.error('Modmail Error', 'You can only use this command inside an active Modmail Thread.')] });
        }

        const thread = message.channel as ThreadChannel;
        const match = thread.name.match(/-(\d+)$/);

        if (!match || !match[1]) {
            return message.reply({ embeds: [EmbedUtils.error('Modmail Error', 'This thread does not appear to be a valid Modmail user thread.')] });
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

        await message.reply({ embeds: [EmbedUtils.success('Thread Closed', `The Modmail thread has been archived. Reason relayed to user: \`${reason}\``)] });
        await thread.setArchived(true);
    }
} as Command;
