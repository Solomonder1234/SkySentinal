import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'withdraw',
    description: 'Withdraw money from your bank.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'Amount to withdraw (or "all").',
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

        if (!amountStr) return interaction.reply('Please specify an amount to withdraw.');

        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });
        if (!user) return interaction.reply('You do not have a profile yet.');

        let amount: bigint;
        if (amountStr.toLowerCase() === 'all') {
            amount = user.bank;
        } else {
            try {
                amount = BigInt(amountStr);
            } catch {
                return interaction.reply('Invalid amount.');
            }
        }

        if (amount <= 0n) return interaction.reply('Invalid amount.');
        if (user.bank < amount) return interaction.reply('You do not have enough money in your bank.');

        await client.database.prisma.userProfile.update({
            where: { id: userId },
            data: {
                balance: { increment: amount },
                bank: { decrement: amount }
            }
        });

        const embed = EmbedUtils.success('Withdraw', `Withdrew **$${amount.toLocaleString()}** from your bank.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
