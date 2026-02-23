import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, User, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'tictactoe',
    description: 'Play Tic-Tac-Toe against another user.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'opponent',
            description: 'The user to play against.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let opponent: User;
        const author = (interaction instanceof Message) ? interaction.author : interaction.user;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                opponent = interaction.mentions.users.first()!;
            } else {
                return interaction.reply('Please mention a user to play against.');
            }
        } else {
            opponent = (interaction as any).options.getUser('opponent', true);
        }

        if (opponent.bot) return interaction.reply('You cannot play against a bot (yet).');
        if (opponent.id === author.id) return interaction.reply('You cannot play against yourself.');

        // Game State
        const board = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0=empty, 1=X (author), 2=O (opponent)
        let turn = author.id; // Start with author
        const players = { [author.id]: 1, [opponent.id]: 2 };
        const symbols = { 0: '➖', 1: '❌', 2: '⭕' }; // Button labels/emojis

        // Initial Board UI
        const getComponents = (disabled = false) => {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder<ButtonBuilder>();
                for (let j = 0; j < 3; j++) {
                    const index = i * 3 + j;
                    const style = board[index] === 0 ? ButtonStyle.Secondary : (board[index] === 1 ? ButtonStyle.Danger : ButtonStyle.Success);
                    const label = symbols[board[index] as 0 | 1 | 2];

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ttt_${index}`)
                            .setLabel(label)
                            .setStyle(style)
                            .setDisabled(disabled || board[index] !== 0)
                    );
                }
                rows.push(row);
            }
            return rows;
        };

        const embed = EmbedUtils.info(
            'Tic-Tac-Toe',
            `**${author.username}** (X) vs **${opponent.username}** (O)\nIt is <@${turn}>'s turn!`
        );

        const replyOptions = { embeds: [embed], components: getComponents() };
        const message = interaction instanceof Message
            ? await interaction.reply(replyOptions)
            : await interaction.reply({ ...replyOptions, fetchReply: true }) as Message;

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (![author.id, opponent.id].includes(i.user.id)) {
                return i.reply({ content: 'You are not part of this game.', ephemeral: true });
            }

            if (i.user.id !== turn) {
                return i.reply({ content: 'It is not your turn!', ephemeral: true });
            }

            const index = parseInt(i.customId.split('_')[1] || '0');
            if (board[index] !== 0) {
                return i.reply({ content: 'That spot is already taken.', ephemeral: true });
            }

            // Update board
            const p = players[i.user.id];
            if (!p) return; // Should not happen due to turn check
            board[index] = p;

            // Check Win
            const checkWin = (player: number) => {
                const wins = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
                    [0, 4, 8], [2, 4, 6]             // Diagonals
                ];
                return wins.some(combo => combo.every(idx => board[idx] === player));
            };

            if (checkWin(p)) {
                const winEmbed = EmbedUtils.success('Tic-Tac-Toe', `🎉 **${i.user.username}** wins!`);
                await i.update({ embeds: [winEmbed], components: getComponents(true) });
                collector.stop();
                return;
            }

            // Check Draw
            if (!board.includes(0)) {
                const drawEmbed = EmbedUtils.info('Tic-Tac-Toe', 'It\'s a draw!');
                await i.update({ embeds: [drawEmbed], components: getComponents(true) });
                collector.stop();
                return;
            }

            // Switch Turn
            turn = turn === author.id ? opponent.id : author.id;
            const nextEmbed = EmbedUtils.info(
                'Tic-Tac-Toe',
                `**${author.username}** (X) vs **${opponent.username}** (O)\nIt is <@${turn}>'s turn!`
            );
            await i.update({ embeds: [nextEmbed], components: getComponents() });
        });

        collector.on('end', async collected => {
            if (collected.size === 0 || (collected.last() && !board.includes(0) && !checkWin(1) && !checkWin(2))) {
                // Clean up if timed out
                try {
                    const timeoutEmbed = EmbedUtils.error('Tic-Tac-Toe', 'Game timed out.');
                    if (interaction instanceof Message) {
                        await message.edit({ embeds: [timeoutEmbed], components: getComponents(true) });
                    } else {
                        await interaction.editReply({ embeds: [timeoutEmbed], components: getComponents(true) });
                    }
                } catch (e) { }
            }
        });

        // Helper specifically for end event check
        function checkWin(player: number) {
            const wins = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            return wins.some(combo => combo.every(idx => board[idx] === player));
        }
    },
} as Command;
