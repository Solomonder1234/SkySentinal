import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';


export default {
    name: 'avatar',
    description: 'Get a user\'s avatar.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to get avatar for.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (userId) {
                try {
                    user = await client.users.fetch(userId);
                } catch (e) {
                    return interaction.reply({ content: 'User not found.' });
                }
            } else {
                user = interaction.author;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user') || interaction.user;
        }

        const embed = EmbedUtils.info(`${user.username}'s Avatar`, 'High-resolution profile picture view.')
            .setImage(user.displayAvatarURL({ size: 4096 }));

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
