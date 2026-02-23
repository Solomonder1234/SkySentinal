import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'clearwarns',
    description: 'Clear all warnings for a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'user',
            description: 'The user to clear warnings for.',
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
            const { count } = await client.database.prisma.case.deleteMany({
                where: {
                    guildId: interaction.guild.id,
                    targetId: user.id,
                    type: 'WARN',
                },
            });

            if (count === 0) {
                const infoEmbed = EmbedUtils.info('No Warnings', `**${user.tag}** has no warnings to clear.`);
                if (interaction instanceof Message) return interaction.reply({ embeds: [infoEmbed] });
                return interaction.reply({ embeds: [infoEmbed] });
            }

            const successEmbed = EmbedUtils.success('Warnings Cleared', `Cleared ${count} warnings for **${user.tag}**.`);
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error(`Failed to clear warnings for ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'An error occurred while clearing warnings.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
