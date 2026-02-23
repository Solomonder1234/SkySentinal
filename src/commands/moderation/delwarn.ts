import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'delwarn',
    description: 'Delete a warning by ID.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'id',
            description: 'The ID of the warning to delete.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let caseId;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide a warning ID.' });
            caseId = parseInt(args[0]);
            if (isNaN(caseId)) return interaction.reply({ content: 'Invalid ID provided.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            caseId = chatInteraction.options.getInteger('id', true);
        }

        if (!interaction.guild) return;

        try {
            const caseRecord = await client.database.prisma.case.findUnique({
                where: { id: caseId },
            });

            if (!caseRecord || caseRecord.guildId !== interaction.guild.id || caseRecord.type !== 'WARN') {
                const errorEmbed = EmbedUtils.error('Not Found', 'Warning not found.');
                if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            await client.database.prisma.case.delete({
                where: { id: caseId },
            });

            const successEmbed = EmbedUtils.success('Warning Deleted', `Warning #${caseId} has been deleted.`);
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error(`Failed to delete warning ${caseId}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'An error occurred while deleting the warning.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
