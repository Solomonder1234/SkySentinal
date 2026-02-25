import { ChatInputCommandInteraction, Message, EmbedBuilder, Colors, TextChannel, ThreadChannel, Client, ChannelType } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'contact',
    description: '📨 Force-open a Modmail thread with a specific user.',
    userPermissions: ['ManageMessages'],
    cooldown: 5,
    run: async (client, message, args) => {
        if (!args[0]) return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a User ID or mention a user to contact.')] });

        const userId = args[0].replace(/[<@!>]/g, '');
        const targetUser = await client.users.fetch(userId).catch(() => null);

        if (!targetUser) return message.reply({ embeds: [EmbedUtils.error('Invalid User', 'Could not locate that user via ID.')] });
        if (targetUser.bot) return message.reply({ embeds: [EmbedUtils.error('Bot Error', 'You cannot open a Modmail thread with a bot.')] });

        const config = JSONDatabase.getGuildConfig(message.guildId!);
        if (!config || !config.modmailChannelId) {
            return message.reply({ embeds: [EmbedUtils.error('Unconfigured', 'Modmail is not configured. Use `!setmodmailchannel`.')] });
        }

        const modmailChannel = message.guild!.channels.cache.get(config.modmailChannelId) as TextChannel;
        if (!modmailChannel) return message.reply({ embeds: [EmbedUtils.error('Error', 'Modmail hub channel not found.')] });

        let targetThread = modmailChannel.threads.cache.find(t => t.name === `${targetUser.username}-${targetUser.id}`) as ThreadChannel;

        if (!targetThread) {
            try {
                const archived = await modmailChannel.threads.fetchArchived();
                targetThread = archived.threads.find(t => t.name === `${targetUser.username}-${targetUser.id}`) as ThreadChannel;
                if (targetThread) await targetThread.setArchived(false);
            } catch (e) { }
        }

        if (targetThread) {
            return message.reply({ embeds: [EmbedUtils.error('Thread Exists', `An active or archived thread for this user already exists: <#${targetThread.id}>`)] });
        }

        targetThread = await modmailChannel.threads.create({
            name: `${targetUser.username}-${targetUser.id}`,
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: `Direct contact requested by ${message.author.tag}`
        });

        const startEmbed = new EmbedBuilder()
            .setTitle('🔔 Direct Contact Initialized')
            .setDescription(`**Staff:** <@${message.author.id}>\n**User:** <@${targetUser.id}> (\`${targetUser.id}\`)\n\nYou have force-opened this thread. Please send your message below. It will be relayed via DM.`)
            .setColor(Colors.Blue)
            .setTimestamp();

        await targetThread.send({ embeds: [startEmbed] });
        return message.reply({ embeds: [EmbedUtils.success('Thread Created', `A dedicated Modmail thread has been initialized here: <#${targetThread.id}>`)] });
    }
} as Command;
