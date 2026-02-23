import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'warnings',
    description: 'View warnings for a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'user',
            description: 'The user to view warnings for.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let user;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user.' });

            try {
                user = await client.users.fetch(userId);
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
        }

        if (!interaction.guild) return;

        try {
            const warnings = await client.database.prisma.case.findMany({
                where: {
                    guildId: interaction.guild.id,
                    targetId: user.id,
                    type: 'WARN',
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            if (warnings.length === 0) {
                const infoEmbed = EmbedUtils.info('No Warnings', `**${user.tag}** has no warnings.`);
                if (interaction instanceof Message) return interaction.reply({ embeds: [infoEmbed] });
                return interaction.reply({ embeds: [infoEmbed] });
            }

            const description = warnings.map(w => `**ID: ${w.id}** - ${w.reason} - <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`).join('\n');
            const embed = EmbedUtils.info(`Warnings for ${user.tag}`, description);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            client.logger.error(`Failed to fetch warnings for ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'An error occurred while fetching warnings.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
