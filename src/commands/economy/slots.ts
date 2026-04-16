import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const SLOTS = ['🍎', '🍊', '🍐', '🍋', '🍉', '🍇', '🍓', '🍒', '💎', '🔔'];

export default {
    name: 'slots',
    description: 'Bet some money on the slot machine.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'bet',
            description: 'The amount of money to bet.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 10,
        },
    ],
    run: async (client, interaction) => {
        const bet = interaction instanceof Message 
            ? parseInt(interaction.content.split(' ')[1] || '0') 
            : (interaction as ChatInputCommandInteraction).options.getInteger('bet', true);

        if (!bet || bet < 10) return interaction.reply('Minimum bet is $10.');

        const userId = interaction.member?.user.id!;
        const profile = await client.economy.getUserProfile(userId);

        if (profile.balance < BigInt(bet)) {
            return interaction.reply({ embeds: [EmbedUtils.error('Insufficient Funds', `You only have **$${profile.balance}** in your wallet.`)] });
        }

        const reel1 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
        const reel2 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
        const reel3 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;

        const win = (reel1 === reel2 && reel2 === reel3);
        const partial = (reel1 === reel2 || reel2 === reel3 || reel1 === reel3);

        let resultMsg = '';
        let multiplier = 0;

        if (win) {
            multiplier = reel1 === '💎' ? 10 : 5;
            resultMsg = `JACKPOT! You won **$${bet * multiplier}**! 🎉`;
            await client.economy.addWallet(userId, bet * (multiplier - 1));
        } else if (partial) {
            multiplier = 1.5;
            resultMsg = `Small win! You got **$${Math.floor(bet * multiplier)}**.`;
            await client.economy.addWallet(userId, Math.floor(bet * (multiplier - 1)));
        } else {
            resultMsg = `You lost **$${bet}**. Better luck next time.`;
            await client.economy.removeWallet(userId, bet);
        }

        await interaction.reply({
            embeds: [EmbedUtils.info('SkySlot Machine', `[ ${reel1} | ${reel2} | ${reel3} ]\n\n${resultMsg}`)]
        });
    },
} as Command;
