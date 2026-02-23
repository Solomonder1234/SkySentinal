import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';

export default {
    name: 'reverse',
    description: 'Reverse text.',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'text',
            description: 'The text to reverse.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let text: string;

        if (interaction instanceof Message) {
            text = interaction.content.split(' ').slice(1).join(' ');
            if (!text) return interaction.reply({ content: 'Please provide text to reverse.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            text = chatInteraction.options.getString('text', true);
        }

        const reversedText = text.split('').reverse().join('');
        await interaction.reply({ content: reversedText });
    },
} as Command;
