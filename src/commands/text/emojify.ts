import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';

const emojiMap: { [key: string]: string } = {
    'a': '🇦', 'b': '🇧', 'c': '🇨', 'd': '🇩', 'e': '🇪', 'f': '🇫', 'g': '🇬', 'h': '🇭', 'i': '🇮', 'j': '🇯', 'k': '🇰', 'l': '🇱', 'm': '🇲', 'n': '🇳', 'o': '🇴', 'p': '🇵', 'q': '🇶', 'r': '🇷', 's': '🇸', 't': '🇹', 'u': '🇺', 'v': '🇻', 'w': '🇼', 'x': '🇽', 'y': '🇾', 'z': '🇿',
    '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣',
    '!': '❗', '?': '❓', '#': '#️⃣', '*': '*️⃣'
};

export default {
    name: 'emojify',
    description: 'Convert text to emojis.',
    category: 'Text',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'text',
            description: 'The text to emojify.',
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

        if (!text) return interaction.reply('Please provide text to emojify.');

        const emojified = text.toLowerCase().split('').map(char => emojiMap[char] || char).join(' ');

        await interaction.reply(emojified);
    },
} as Command;
