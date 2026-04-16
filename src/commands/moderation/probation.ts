import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

function parseDuration(duration: string): number | null {
    const regex = /^(\d+)(s|m|h|d|w)$/;
    const match = duration.match(regex);
    if (!match) return null;

    const value = parseInt(match[1] as string);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60000;
        case 'h': return value * 3600000;
        case 'd': return value * 86400000;
        case 'w': return value * 604800000;
        default: return null;
    }
}

export default {
    name: 'probation',
    description: 'Temporarily unban a user for a set trial period.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'user_id',
            description: 'The ID of the user to put on probation.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'duration',
            description: 'Duration of the probation (e.g. 1d, 1h).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the probation.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction, args) => {
        let userId = '';
        let durationStr = '';
        let reason = 'Testing probation period.';

        if (interaction instanceof Message) {
            userId = (args && args[0]) ? args[0].replace(/[<@!>]/g, '') : '';
            durationStr = (args && args[1]) || '';
            reason = (args && args.length > 2) ? args.slice(2).join(' ') : reason;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            userId = chatInteraction.options.getString('user_id', true);
            durationStr = chatInteraction.options.getString('duration', true);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!userId) return interaction.reply({ content: 'Please provide a valid User ID.' });
        
        const durationMs = parseDuration(durationStr);
        if (!durationMs) {
            const err = EmbedUtils.error('Invalid Duration', 'Please use a valid format (e.g. 1d, 12h, 30m).');
            return interaction.reply({ embeds: [err] });
        }

        const guild = interaction.guild;
        if (!guild) return;

        try {
            // Check if banned
            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                const err = EmbedUtils.error('Not Banned', 'That user is not currently banned in this server.');
                return interaction.reply({ embeds: [err] });
            }

            // Unban
            await guild.members.unban(userId, `Probation started (${durationStr}): ${reason}`);

            // Log to DB
            const modId = interaction instanceof Message ? interaction.author.id : (interaction as ChatInputCommandInteraction).user.id;
            await client.database.prisma.case.create({
                data: {
                    guildId: guild.id,
                    targetId: userId,
                    moderatorId: modId,
                    type: 'PROBATION',
                    reason: reason,
                    duration: durationMs,
                    active: true,
                }
            });

            const successEmbed = EmbedUtils.success('Probation Protocol Initiated', 
                `**User ID:** \`${userId}\` has been unbanned for a trial period of **${durationStr}**.\n\n**Note:** This user will be automatically re-banned once the period expires.\n**Reason:** ${reason}`
            );

            await interaction.reply({ embeds: [successEmbed] });

            // Try to DM the user
            const targetUser = await client.users.fetch(userId).catch(() => null);
            if (targetUser) {
                const dmEmbed = EmbedUtils.info('Trial Access Granted', 
                    `You have been granted temporary access to **${guild.name}** for a probation period of **${durationStr}**.\n\n**Terms:**\n- This is a trial period. Any violations will result in an immediate and permanent removal.\n- You will be automatically re-banned after **${durationStr}** unless extended or fully cleared by staff.\n\n**Reason:** ${reason}`
                );
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);
            }

        } catch (error) {
            client.logger.error(`Failed to initiate probation for ${userId}:`, error);
            await interaction.reply({ content: 'An error occurred while initiating probation. Please ensure I have "Ban Members" permissions.' });
        }
    }
} as Command;
