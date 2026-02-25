import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel, Client } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'mmblock',
    description: '🚫 Block a user from using the Modmail system.',
    userPermissions: ['ModerateMembers'],
    cooldown: 5,
    run: async (client, message, args) => {
        if (!args[0]) return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a User ID or mention a user to block.')] });

        const userId = args[0].replace(/[<@!>]/g, '');
        const targetUser = await client.users.fetch(userId).catch(() => null);

        if (!targetUser) return message.reply({ embeds: [EmbedUtils.error('Invalid User', 'Could not locate that user via ID.')] });

        const success = JSONDatabase.blockModmailUser(message.guildId!, userId);

        if (!success) {
            return message.reply({ embeds: [EmbedUtils.error('Already Blocked', `**${targetUser.tag}** is already on the Modmail blocklist.`)] });
        }

        return message.reply({ embeds: [EmbedUtils.success('Modmail Block', `**${targetUser.tag}** (\`${targetUser.id}\`) has been permanently restricted from creating Modmail threads.`)] });
    }
} as Command;
