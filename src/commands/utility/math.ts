import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { evaluate } from 'mathjs';

export default {
    name: 'math',
    description: 'Evaluate a mathematical expression.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'expression',
            description: 'The math expression to solve.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let expression = '';

        if (interaction instanceof Message) {
            expression = interaction.content.split(' ').slice(1).join(' ');
        } else {
            expression = (interaction as ChatInputCommandInteraction).options.getString('expression', true);
        }

        if (!expression) return interaction.reply('Please provide an expression.');

        try {
            const result = evaluate(expression);

            const embed = EmbedUtils.info(
                '🧮 Calculator',
                `**Expression:** \`${expression}\`\n**Result:** \`${result}\``
            );
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            await interaction.reply({ content: 'Invalid expression.', ephemeral: true });
        }
    },
} as Command;
