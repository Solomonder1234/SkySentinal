import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'dice',
    description: 'Roll a die (or multiple dice).',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'sides',
            description: 'Number of sides on the die (default: 6)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 2,
        },
        {
            name: 'amount',
            description: 'Number of dice to roll (default: 1)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 10,
        }
    ],
    run: async (client, interaction) => {
        let sides = 6;
        let amount = 1;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args[0]) sides = parseInt(args[0]) || 6;
            if (args[1]) amount = parseInt(args[1]) || 1;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            sides = chatInteraction.options.getInteger('sides') || 6;
            amount = chatInteraction.options.getInteger('amount') || 1;
        }

        // Cap values for safety
        if (amount > 10) amount = 10;
        if (sides > 1000) sides = 1000;

        const results = [];
        let total = 0;
        for (let i = 0; i < amount; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            results.push(roll);
            total += roll;
        }

        const embed = EmbedUtils.info(
            '🎲 Dice Roll',
            `Rolled **${amount}** x **D${sides}**\n\n**Results:** ${results.join(', ')}\n**Total:** ${total}`
        );

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
