import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'slots',
    description: 'Bet money on the slot machine.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'Amount to bet.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 10
        }
    ],
    run: async (client, interaction) => {
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        let betAmount: bigint;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please specify an amount to bet.' });
            try {
                betAmount = BigInt(args[0]);
            } catch {
                return interaction.reply({ content: 'Please specify a valid amount to bet.' });
            }
        } else {
            betAmount = BigInt((interaction as ChatInputCommandInteraction).options.getInteger('amount', true));
        }

        if (betAmount < 10n) return interaction.reply({ content: 'Minimum bet is $10.' });

        const profile = await client.economy.getUserProfile(user.id);
        if (profile.balance < betAmount) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Insufficient Funds', `You only have **$${profile.balance.toLocaleString()}**.`)]
            });
        }

        // Deduct money first
        await client.economy.removeWallet(user.id, betAmount);

        const fruits = ['🍒', '🍊', '🍇', '🍋', '🔔', '💎', '7️⃣'];
        const line1 = fruits[Math.floor(Math.random() * fruits.length)];
        const line2 = fruits[Math.floor(Math.random() * fruits.length)];
        const line3 = fruits[Math.floor(Math.random() * fruits.length)];

        let winnings = 0n;
        let resultText = 'You lost!';

        if (line1 === line2 && line2 === line3) {
            winnings = betAmount * 5n;
            resultText = `**JACKPOT!** You won **$${winnings.toLocaleString()}**!`;
        } else if (line1 === line2 || line2 === line3 || line1 === line3) {
            winnings = (betAmount * 15n) / 10n; // 1.5xmultiplier
            resultText = `**Nice!** You won **$${winnings.toLocaleString()}**!`;
        }

        if (winnings > 0n) {
            await client.economy.addWallet(user.id, winnings);
        }

        const embed = winnings > 0
            ? EmbedUtils.success('🎰 Slots 🎰', `| ${line1} | ${line2} | ${line3} |\n\n${resultText}`)
            : EmbedUtils.error('🎰 Slots 🎰', `| ${line1} | ${line2} | ${line3} |\n\n${resultText}`);

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
