import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'dm',
    description: 'DM a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: 'user',
            description: 'The user to DM.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'message',
            description: 'The message to send.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let messageContent = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args.length < 2) return interaction.reply({ content: '❌ **Usage:** `!dm <@user/ID> <message>`' });

            const targetInput = args[0]!;
            const userId = targetInput.replace(/[<@!>]/g, '');

            if (!userId || !/^\d{17,20}$/.test(userId)) {
                return interaction.reply({ content: '❌ **Error:** Invalid User ID or mention provided.' });
            }

            try {
                user = await client.users.fetch(userId);
                messageContent = args.slice(1).join(' ');
                if (!messageContent) return interaction.reply({ content: '❌ Please provide a message to send.' });
            } catch (e) {
                return interaction.reply({ content: '❌ **Error:** User not found in Discord database.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            messageContent = chatInteraction.options.getString('message', true);
        }

        try {
            const dmEmbed = EmbedUtils.info(`Message from ${interaction.guild?.name}`, messageContent);
            await user.send({ embeds: [dmEmbed] });

            const successEmbed = EmbedUtils.success('DM Sent', `Sent message to **${user.tag}**.`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            const errorEmbed = EmbedUtils.error('Error', 'Failed to send DM. User may have DMs off.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
