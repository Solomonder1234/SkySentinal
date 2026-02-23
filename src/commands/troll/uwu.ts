import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';

function uwuify(text: string): string {
    return text
        .replace(/[rl]/g, 'w')
        .replace(/[RL]/g, 'W')
        .replace(/n([aeiou])/g, 'ny$1')
        .replace(/N([aeiou])/g, 'Ny$1')
        .replace(/N([AEIOU])/g, 'Ny$1')
        .replace(/ove/g, 'uv')
        + ' uwu';
}

export default {
    name: 'uwu',
    description: 'Uwuify text.',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'text',
            description: 'The text to uwuify.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let text: string;

        if (interaction instanceof Message) {
            text = interaction.content.split(' ').slice(1).join(' ');
            if (!text) return interaction.reply({ content: 'Please provide text to uwuify.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            text = chatInteraction.options.getString('text', true);
        }

        await interaction.reply({ content: uwuify(text) });
    },
} as Command;
