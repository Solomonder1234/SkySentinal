import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'rickroll',
    description: 'Send a special gift to a user (DM).',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator, // Admin only to prevent abuse
    options: [
        {
            name: 'user',
            description: 'The user to rickroll.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let targetUser: User;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                return interaction.reply({ content: 'Please mention a user.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user', true);
        }

        try {
            await targetUser.send('Hey! Check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            const successEmbed = EmbedUtils.success('Target Acquired', `Sent a rickroll to **${targetUser.tag}**. 🕺`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
        } catch (error) {
            const failEmbed = EmbedUtils.error('Mission Failed', `Could not DM **${targetUser.tag}**. They are safe... for now.`);
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [failEmbed] });
            } else {
                await interaction.reply({ embeds: [failEmbed], ephemeral: true });
            }
        }
    },
} as Command;
