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
    name: 'timeout',
    description: 'Timeouts a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'user',
            description: 'The user to timeout.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'duration',
            description: 'Duration (e.g. 1m, 1h, 1d)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the timeout.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let durationStr;
        let reason = 'No reason provided';
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            durationStr = args[1];

            if (!userId) return interaction.reply({ content: 'Please provide a user to timeout.' });
            if (!durationStr) return interaction.reply({ content: 'Please provide a duration.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
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

        if (!member) {
            return interaction.reply({ content: 'User is not in the server.', ephemeral: true });
        }

        if (member instanceof GuildMember && !member.moderatable) {
            const errorEmbed = EmbedUtils.error('Timeout Failed', 'I cannot timeout this user. They may have a higher role than me.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const durationMs = parseDuration(durationStr || '');
        if (!durationMs) {
            const errorEmbed = EmbedUtils.error('Invalid Duration', 'Please use a valid duration format (e.g. 10m, 1h, 1d).');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await member.timeout(durationMs, reason);
            const successEmbed = EmbedUtils.success('User Timed Out', `**${user.tag}** has been timed out for ${durationStr}.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to timeout user ${user.tag} (${user.id}):`, error);
            const errorEmbed = EmbedUtils.error('Timeout Failed', 'An error occurred while trying to timeout the user.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
