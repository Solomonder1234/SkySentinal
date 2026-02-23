import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'rps',
    description: 'Play Rock, Paper, Scissors against the bot.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder().setCustomId('rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Primary)
            );

        const embed = EmbedUtils.info('Rock, Paper, Scissors', 'Choose your weapon!');
        const gameMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

        collector.on('collect', async (i: any) => {
            // Check correct user
            const userId = (interaction instanceof Message) ? (interaction as Message).author.id : (interaction as any).user.id;

            if (i.user.id !== userId) {
                await i.reply({ content: `This game is for <@${userId}>`, ephemeral: true });
                return;
            }

            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            const userChoice = i.customId;

            let result;
            if (userChoice === botChoice) result = 'It\'s a tie!';
            else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) result = 'You win! 🎉';
            else result = 'I win! 🤖';

            const resultEmbed = EmbedUtils.info('Rock, Paper, Scissors', `You chose **${userChoice}**\nI chose **${botChoice}**\n\n**${result}**`);

            // Disable buttons
            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );

            await i.update({ embeds: [resultEmbed], components: [disabledRow] });
            collector.stop();
        });

        collector.on('end', async (collected: any) => {
            if (collected.size === 0) {
                const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                // For message command, we can't use editReply usually if we replied with message?
                // actually we can use message.edit
                await gameMessage.edit({ content: 'Time\'s up!', components: [disabledRow] });
            }
        });
    },
} as Command;
