import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'nick',
    description: 'Change a user\'s nickname.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageNicknames,
    options: [
        {
            name: 'user',
            description: 'The user to change nickname for.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'nickname',
            description: 'The new nickname (leave empty to reset).',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let nickname = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user.' });

            try {
                user = await client.users.fetch(userId);
                nickname = args.slice(1).join(' ');
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            nickname = chatInteraction.options.getString('nickname') || '';
        }

        const member = interaction.guild?.members.cache.get(user.id);
        if (!member) return interaction.reply({ content: 'User is not in the server.' });

        try {
            if (interaction.guild?.members.me?.roles.highest.position! <= member.roles.highest.position) {
                return interaction.reply({ content: 'I cannot manage this user. They have a higher or equal role.' });
            }

            await member.setNickname(nickname || null);
            const successEmbed = EmbedUtils.success('Nickname Changed', `Changed nickname for **${user.tag}** to **${nickname || 'Default'}**.`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to change nickname for ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'Failed to change nickname.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
