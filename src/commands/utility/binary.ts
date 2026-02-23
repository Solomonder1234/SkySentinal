import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';

export default {
    name: 'binary',
    description: 'Convert text to binary.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'text',
            description: 'The text to convert.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let text: string;
        if (interaction instanceof Message) {
            text = interaction.content.split(' ').slice(1).join(' ');
        } else {
            text = (interaction as ChatInputCommandInteraction).options.getString('text')!;
        }

        if (!text) return interaction.reply('Please provide text to convert.');

        const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        await interaction.reply({ content: `\`\`\`\n${binary}\n\`\`\`` });
    },
} as Command;
