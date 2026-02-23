import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const words = ['javascript', 'typescript', 'discord', 'computer', 'programming', 'algorithm', 'database', 'internet', 'server', 'application'];

export default {
    name: 'hangman',
    description: 'Play a game of Hangman.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const word = words[Math.floor(Math.random() * words.length)]!;
        const guessed = new Set<string>();
        let lives = 6;

        const getDisplay = () => {
            return word.split('').map(char => guessed.has(char) ? char : '_').join(' ');
        };

        const embed = EmbedUtils.info(
            'Hangman',
            `Word: \`${getDisplay()}\`\nLives: ${lives}\nGuessed: ${Array.from(guessed).join(', ')}`
        );
        embed.setFooter({ text: 'Type a letter to guess!' });

        const gameMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Collector
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const channel = interaction.channel;

        if (!channel || !channel.isTextBased() || channel.isDMBased()) return;

        // Cast to TextChannel or similar that has createMessageCollector
        // Actually TextBasedChannel should have it, but let's be safe
        const collector = (channel as any).createMessageCollector({
            filter: (m: Message) => m.author.id === userId && m.content.length === 1 && /^[a-z]$/i.test(m.content),
            time: 60000
        });

        collector.on('collect', async (m: Message) => {
            const letter = m.content.toLowerCase();

            // Delete user message to keep chat clean (if possible)
            if (m.deletable) m.delete().catch(() => { });

            if (guessed.has(letter)) {
                return;
            }

            guessed.add(letter);

            if (!word.includes(letter)) {
                lives--;
            }

            const currentDisplay = getDisplay();

            if (!currentDisplay.includes('_')) {
                const winEmbed = EmbedUtils.success('Hangman - You Won! 🎉', `The word was **${word}**.`);
                await gameMessage.edit({ embeds: [winEmbed] });
                collector.stop();
                return;
            }

            if (lives <= 0) {
                const loseEmbed = EmbedUtils.error('Hangman - Game Over ☠️', `The word was **${word}**.`);
                await gameMessage.edit({ embeds: [loseEmbed] });
                collector.stop();
                return;
            }

            const updateEmbed = EmbedUtils.info(
                'Hangman',
                `Word: \`${currentDisplay}\`\nLives: ${lives}\nGuessed: ${Array.from(guessed).join(', ')}`
            );
            await gameMessage.edit({ embeds: [updateEmbed] });
        });

        collector.on('end', async (collected: any, reason: string) => {
            if (reason === 'time') {
                const timeoutEmbed = EmbedUtils.error('Hangman - Timed Out', `The word was **${word}**.`);
                await gameMessage.edit({ embeds: [timeoutEmbed] });
            }
        });
    },
} as Command;
