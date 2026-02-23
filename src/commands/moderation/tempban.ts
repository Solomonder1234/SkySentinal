import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
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
    name: 'tempban',
    description: 'Temporarily ban a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'user',
            description: 'The user to tempban.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'duration',
            description: 'Duration of the ban (e.g. 1d, 1h).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the tempban.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let member: GuildMember | undefined;
        let durationStr = '';
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
                durationStr = args[1] || '';
                reason = args.slice(2).join(' ') || reason;
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = interaction.guild?.members.cache.get(user.id);
            durationStr = chatInteraction.options.getString('duration', true);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        const durationMs = parseDuration(durationStr);
        if (!durationMs) {
            const errorEmbed = EmbedUtils.error('Invalid Duration', 'Please use a valid duration (e.g. 1d, 12h, 30m).');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (member && !member.bannable) {
            const errorEmbed = EmbedUtils.error('Tempban Failed', 'I cannot ban this user. They may have a higher role than me.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await interaction.guild?.members.ban(user, { reason: `Tempban (${durationStr}): ${reason}` });

            // Log to DB
            await client.database.prisma.case.create({
                data: {
                    guildId: interaction.guild!.id,
                    targetId: user.id,
                    moderatorId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
                    type: 'TEMPBAN',
                    reason: reason,
                    duration: durationMs,
                    active: true,
                },
            });

            const successEmbed = EmbedUtils.success('User Tempbanned', `**${user.tag}** has been banned for **${durationStr}**.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to tempban user ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Tempban Failed', 'An error occurred.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
