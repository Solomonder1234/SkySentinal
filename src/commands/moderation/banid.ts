import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'banid',
    description: 'Ban a user by their ID (even if not in server).',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'userid',
            description: 'The ID of the user to ban.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the ban.',
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
            await interaction.guild?.members.ban(userId, { reason });
            const successEmbed = EmbedUtils.success('User Banned', `User with ID **${userId}** has been banned.\nReason: ${reason}`);

            client.logger.info(`User ${userId} was banned by ${interaction.member?.user.username} via banid.`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to ban user ID ${userId}:`, error);
            const errorEmbed = EmbedUtils.error('Ban Failed', 'An error occurred. Check if the ID is valid or if the user is already banned.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
