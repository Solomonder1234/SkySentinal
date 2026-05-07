import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'ship',
    description: 'Calculate the compatibility between two users.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user1',
            description: 'The first user.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'user2',
            description: 'The second user.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const u1 = (interaction instanceof Message) 
            ? interaction.author 
            : (interaction as ChatInputCommandInteraction).options.getUser('user1', true);

        const u2 = (interaction instanceof Message) 
            ? (interaction.mentions.users.last() || interaction.author) 
            : ((interaction as ChatInputCommandInteraction).options.getUser('user2') || interaction.user);

        if (u1.id === u2.id) return interaction.reply('You can\'t ship yourself! (Or can you?) 🤨');

        // Seeded random based on IDs so it stays consistent for a day
        const seed = parseInt(u1.id.slice(-4)) + parseInt(u2.id.slice(-4)) + new Date().getDate();
        const score = (seed * 1337) % 101;

        let comment = "A match made in the upper atmosphere! 🌌";
        if (score < 25) comment = "A cold front is moving in... ❄️";
        else if (score < 50) comment = "Cloudy with a chance of friendship. ☁️";
        else if (score < 75) comment = "The winds are picking up! 🌪️";
        else if (score < 90) comment = "Severe heat warning! ☀️";

        const bar = '▬'.repeat(Math.floor(score / 10)) + '🔘' + '▬'.repeat(10 - Math.floor(score / 10));

        await interaction.reply({
            embeds: [EmbedUtils.info('SkySentinel Ship Calculator', `**${u1.username}** & **${u2.username}**\n\n**Match Score:** ${score}%\n\`${bar}\`\n\n*${comment}*`)]
        });
    },
} as Command;
