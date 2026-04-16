import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';

export default {
    name: 'clap',
    description: 'Add 👏 clap 👏 emojis 👏 to 👏 text.',
    prefixOnly: true,
    category: 'Text',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'text',
            description: 'The text to clap.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let text = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            text = args.join(' ');
        } else {
            text = (interaction as ChatInputCommandInteraction).options.getString('text', true);
        }

        if (!text) return interaction.reply('Please provide text to clap.');

        const clapped = text.replace(/\s+/g, ' 👏 ');

        await interaction.reply(clapped);
    },
} as Command;
