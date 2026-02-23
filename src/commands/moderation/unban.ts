import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unban',
    description: 'Unban a user by their ID.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'userid',
            description: 'The ID of the user to unban.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the unban.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let userId = '';
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            userId = args[0]?.replace(/[<@!>]/g, '') || '';
            if (!userId) return interaction.reply({ content: 'Please provide a user ID.' });
            reason = args.slice(1).join(' ') || reason;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            userId = chatInteraction.options.getString('userid', true);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        try {
            await interaction.guild?.members.unban(userId, reason);
            const successEmbed = EmbedUtils.success('User Unbanned', `User with ID **${userId}** has been unbanned.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to unban user ID ${userId}:`, error);
            const errorEmbed = EmbedUtils.error('Unban Failed', 'An error occurred. Check if the ID is valid or if the user is mapped.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
