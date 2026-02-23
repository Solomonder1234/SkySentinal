import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'deposit',
    description: 'Deposit money into your bank.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'Amount to deposit (or "all").',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        let amountStr = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            amountStr = args[0] || '';
        } else {
            amountStr = (interaction as ChatInputCommandInteraction).options.getString('amount', true);
        }

        if (!amountStr) return interaction.reply('Please specify an amount to deposit.');

        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });
        if (!user) return interaction.reply('You do not have a profile yet. Use chat to earn XP first.');

        let amount: bigint;
        if (amountStr.toLowerCase() === 'all') {
            amount = user.balance;
        } else {
            try {
                amount = BigInt(amountStr);
            } catch {
                return interaction.reply('Invalid amount.');
            }
        }

        if (amount <= 0n) return interaction.reply('Invalid amount.');
        if (user.balance < amount) return interaction.reply('You do not have enough money.');

        await client.database.prisma.userProfile.update({
            where: { id: userId },
            data: {
                balance: { decrement: amount },
                bank: { increment: amount }
            }
        });

        const embed = EmbedUtils.success('Deposit', `Deposited **$${amount.toLocaleString()}** into your bank.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
