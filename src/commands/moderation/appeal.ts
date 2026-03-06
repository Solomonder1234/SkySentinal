import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'appeal',
    description: 'Accept or deny a user\'s formal appeal.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'decision',
            description: 'Accept or Deny the appeal',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'accept', value: 'accept' },
                { name: 'deny', value: 'deny' }
            ]
        },
        {
            name: 'user',
            description: 'The user to message (leave blank if running inside a modmail thread)',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
        {
            name: 'reason',
            description: 'The reason or message to provide the user',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    run: async (client, interaction) => {
        let decision: string;
        let userId: string | undefined;
        let reason = 'No further information provided by the Senior Enforcement Branch.';
        let targetUser: any;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            decision = args[0]?.toLowerCase();

            if (!['accept', 'deny', 'decline'].includes(decision)) {
                return interaction.reply({ content: 'Invalid syntax. Use `!appeal accept <user> [message]` or `!appeal deny <user> [message]`.\nYou can also run `!appeal accept [message]` inside an active modmail thread.' });
            }

            const potentialUser = args[1]?.replace(/[<@!>]/g, '');

            if (potentialUser && /^\d{17,20}$/.test(potentialUser)) {
                userId = potentialUser;
                if (args.length > 2) reason = args.slice(2).join(' ');
            } else {
                // Try to infer from modmail channel
                const channelName = (interaction.channel as TextChannel)?.name;
                if (channelName && channelName.startsWith('mm-')) {
                    userId = channelName.replace('mm-', '');
                    if (args.length > 1) reason = args.slice(1).join(' ');
                }
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            decision = chatInteraction.options.getString('decision', true);
            const userOpt = chatInteraction.options.getUser('user');

            if (userOpt) {
                userId = userOpt.id;
            } else {
                const channelName = (chatInteraction.channel as TextChannel)?.name;
                if (channelName && channelName.startsWith('mm-')) {
                    userId = channelName.replace('mm-', '');
                }
            }
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!userId) {
            return interaction.reply({ content: 'Could not determine the user. Please provide a User ID or run this inside their modmail thread.', ephemeral: true });
        }

        try {
            targetUser = await client.users.fetch(userId);
        } catch (e) {
            return interaction.reply({ content: 'User not found in the Discord network.', ephemeral: true });
        }

        const isAccepted = decision === 'accept';
        const statusColor = isAccepted ? 0x57F287 : 0xED4245; // Green vs Red
        const statusWord = isAccepted ? 'ACCEPTED' : 'DENIED';

        // Direct Message to User
        const dmEmbed = EmbedUtils.premium(
            `Formal Appeal ${statusWord}`,
            `Your recent infraction appeal has been reviewed and **${statusWord}** by the Senior Enforcement Branch.\n\n**Staff Message:**\n${reason}`
        ).setColor(statusColor);

        let dmSuccess = true;
        try {
            await targetUser.send({ embeds: [dmEmbed] });
        } catch (err) {
            dmSuccess = false;
        }

        // Response in the channel
        const staffResponseEmbed = EmbedUtils.success(
            `Appeal Processed: ${targetUser.tag}`,
            `The appeal for <@${targetUser.id}> was marked as **${statusWord}**.\n\n**Message Sent:**\n${reason}\n\n**User Notified:** ${dmSuccess ? '✅ Yes' : '❌ No (DMs Closed)'}`
        ).setColor(statusColor);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [staffResponseEmbed] });
        } else {
            await interaction.reply({ embeds: [staffResponseEmbed] });
        }

        if (!interaction.guild) return;

        // Log to Appeal Log Channel if configured
        const jsonConf = JSONDatabase.getGuildConfig(interaction.guild.id);
        const appealLogId = jsonConf.appealLogChannelId;

        if (appealLogId) {
            const logChannel = interaction.guild.channels.cache.get(appealLogId) as TextChannel;
            if (logChannel) {
                const logEmbed = EmbedUtils.premium(
                    `Appeal Audit Log`,
                    `**Target:** <@${userId}> (\`${userId}\`)\n**Decision:** ${statusWord}\n**Processing Staff:** <@${interaction.member?.user.id}>\n\n**Sent Message:**\n${reason}`
                ).setColor(statusColor).setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }
        }
    },
} as Command;
