import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import axios from 'axios';
import { decodeHtmlEntities } from '../../utils/HtmlUtils';

export default {
    name: 'trivia',
    description: 'Play a game of trivia.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'difficulty',
            description: 'Difficulty level',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Easy', value: 'easy' },
                { name: 'Medium', value: 'medium' },
                { name: 'Hard', value: 'hard' },
            ]
        }
    ],
    run: async (client, interaction) => {
        let difficulty = 'medium';
        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            difficulty = args[0] || 'medium';
        } else {
            difficulty = (interaction as ChatInputCommandInteraction).options.getString('difficulty') || 'medium';
        }

        try {
            const url = `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=${difficulty}`;
            const response = await axios.get(url);

            if (!response.data.results || response.data.results.length === 0) {
                return interaction.reply({ content: 'Failed to fetch trivia question. Try again later.' });
            }

            const data = response.data.results[0];
            const question = decodeHtmlEntities(data.question);
            const correctAnswer = decodeHtmlEntities(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map((a: string) => decodeHtmlEntities(a));

            // Shuffle answers
            const allAnswers = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);

            const row = new ActionRowBuilder<ButtonBuilder>();
            allAnswers.forEach((ans, index) => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`trivia_${index}`)
                        .setLabel(ans.substring(0, 80)) // Limit length for safety
                        .setStyle(ButtonStyle.Primary)
                );
            });

            const embed = EmbedUtils.info(
                `Trivia (${data.category}) - ${difficulty.toUpperCase()}`,
                `**${question}**\n\nYou have 15 seconds!`
            );

            const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

            collector.on('collect', async i => {
                const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;

                if (i.user.id !== userId) {
                    return i.reply({ content: 'This is not your trivia game!', ephemeral: true });
                }

                const selectedIndex = parseInt(i.customId.split('_')[1] || '0');
                const selectedAnswer = allAnswers[selectedIndex];

                if (selectedAnswer === correctAnswer) {
                    const winEmbed = EmbedUtils.success('Correct!', `The answer was **${correctAnswer}**.`);
                    await i.update({ embeds: [winEmbed], components: [] });
                } else {
                    const loseEmbed = EmbedUtils.error('Wrong!', `You chose **${selectedAnswer}**.\nThe correct answer was **${correctAnswer}**.`);
                    await i.update({ embeds: [loseEmbed], components: [] });
                }
                collector.stop();
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = EmbedUtils.error('Time\'s Up!', `The correct answer was **${correctAnswer}**.`);
                    try {
                        if (interaction instanceof Message) {
                            await message.edit({ embeds: [timeoutEmbed], components: [] });
                        } else {
                            await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                        }
                    } catch (e) { }
                }
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while fetching trivia.' });
        }
    },
} as Command;
