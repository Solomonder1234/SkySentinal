import { ApplicationCommandType, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'cancelapp',
    description: 'Cancel your current active staff or sub-team application.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        const guildId = interaction.guildId;

        if (!guildId) return;

        if (!(interaction instanceof Message)) await interaction.deferReply({ flags: ['Ephemeral'] as any });

        try {
            // Find active application
            const app = await client.database.prisma.application.findFirst({
                where: { guildId, userId, status: 'IN_PROGRESS' }
            });

            if (!app) {
                const noAppEmbed = EmbedUtils.error('No Active Application', 'You do not currently have an application in progress that can be cancelled.');
                return interaction instanceof Message ? interaction.reply({ embeds: [noAppEmbed] }) : (interaction as ChatInputCommandInteraction).editReply({ embeds: [noAppEmbed] });
            }

            // Delete from database
            await client.database.prisma.application.delete({
                where: { id: app.id }
            });

            // Attempt to delete channel
            try {
                const channel = await interaction.guild?.channels.fetch(app.channelId);
                if (channel) await channel.delete('User cancelled application');
            } catch (e) {
                // Channel might already be deleted manually
            }

            const successEmbed = EmbedUtils.success('Application Cancelled', 'Your active application has been successfully cancelled and the channel has been deleted. You may now start a new application.');

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await (interaction as ChatInputCommandInteraction).editReply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error('Error in cancelapp command:', error);
            const errOptions = { content: 'An error occurred while attempting to cancel your application.', ephemeral: true };
            if (interaction instanceof Message) {
                await interaction.reply(errOptions);
            } else {
                await (interaction as ChatInputCommandInteraction).editReply(errOptions as any);
            }
        }
    }
} as Command;
