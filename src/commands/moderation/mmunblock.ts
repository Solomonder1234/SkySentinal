import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel, Client } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'mmunblock',
    description: '✅ Remove a user from the Modmail blocklist.',
    userPermissions: ['ModerateMembers'],
    cooldown: 5,
    run: async (client, message, args) => {
        if (!args[0]) return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a User ID or mention a user to unblock.')] });

        const userId = args[0].replace(/[<@!>]/g, '');

        const success = JSONDatabase.unblockModmailUser(message.guildId!, userId);

        if (!success) {
            return message.reply({ embeds: [EmbedUtils.error('Not Blocked', `That user is not currently on the Modmail blocklist.`)] });
        }

        return message.reply({ embeds: [EmbedUtils.success('Modmail Unblock', `The user \`${userId}\` has had their Modmail privileges restored.`)] });
    }
} as Command;
