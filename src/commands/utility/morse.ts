import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';

const MORSE_CODE: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----', ' ': '/'
};

export default {
    name: 'morse',
    description: 'Convert text to morse code.',
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

        const morse = text.toUpperCase().split('').map(c => MORSE_CODE[c] || c).join(' ');
        await interaction.reply({ content: `\`\`\`\n${morse}\n\`\`\`` });
    },
} as Command;
