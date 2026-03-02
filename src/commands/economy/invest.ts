import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'invest',
    description: 'Buy or sell stocks using your bank balance.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'action',
            description: 'Buy or Sell',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Buy', value: 'buy' },
                { name: 'Sell', value: 'sell' }
            ]
        },
        {
            name: 'symbol',
            description: 'Stock Ticker Symbol (e.g. AAPL)',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'amount',
            description: 'Amount of cash to invest (Buy) OR amount of shares to dump (Sell)',
            type: ApplicationCommandOptionType.Number,
            required: true
        }
    ],
    run: async (client, interaction) => {
        let action = '';
        let symbol = '';
        let amount = 0;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            action = args[0]?.toLowerCase() || '';
            symbol = args[1]?.toUpperCase() || '';
            amount = parseFloat(args[2] || '0');
        } else {
            const commandInteraction = interaction as ChatInputCommandInteraction;
            action = commandInteraction.options.getString('action', true);
            symbol = commandInteraction.options.getString('symbol', true).toUpperCase();
            amount = commandInteraction.options.getNumber('amount', true);
        }

        if (!['buy', 'sell'].includes(action) || !symbol || isNaN(amount) || amount <= 0) {
            const helpEmbed = EmbedUtils.info(
                'Invest Command',
                '**Usage:** \\`!invest <buy/sell> <symbol> <amount>\\`\n*Example:* \\`!invest buy AAPL 5000\\` (Invests $5000)\n*Example:* \\`!invest sell MSFT 2.5\\` (Sells 2.5 shares)'
            );
            return interaction.reply({ embeds: [helpEmbed] });
        }

        const msg = await interaction.reply({ content: `📈 Contacting Stock Exchange for **${symbol}**...` });

        // Fetch Live Price
        let currentPrice = 0;
        try {
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
            const data = await res.json();
            if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
                return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                    content: '',
                    embeds: [EmbedUtils.error('Market Error', `Could not find stock symbol **${symbol}**.`)]
                });
            }
            currentPrice = data.chart.result[0].meta.regularMarketPrice;
        } catch (e) {
            return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                content: '',
                embeds: [EmbedUtils.error('Market Error', `Failed to connect to the stock exchange.`)]
            });
        }

        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        const profile = await client.economy.getUserProfile(userId);

        if (action === 'buy') {
            // amount represents cash
            const cost = amount;
            if (profile.bank < BigInt(Math.floor(cost))) {
                return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                    content: '',
                    embeds: [EmbedUtils.error('Insufficient Funds', `You need **$${cost.toLocaleString()}** in your Bank to invest. You only have **$${profile.bank.toLocaleString()}**.`)]
                });
            }

            const sharesBought = cost / currentPrice;

            // Deduct Bank
            await client.economy.removeBank(userId, Math.floor(cost));

            // Add Investment
            const existing = await (client.database.prisma as any).investment.findUnique({
                where: { userId_symbol: { userId, symbol } }
            });

            if (existing) {
                // Calculate new average price
                const totalCost = (existing.shares * existing.averagePrice) + cost;
                const totalShares = existing.shares + sharesBought;
                const newAvg = totalCost / totalShares;
                await (client.database.prisma as any).investment.update({
                    where: { id: existing.id },
                    data: { shares: totalShares, averagePrice: newAvg }
                });
            } else {
                await (client.database.prisma as any).investment.create({
                    data: { userId, symbol, shares: sharesBought, averagePrice: currentPrice }
                });
            }

            const successEmbed = EmbedUtils.success(
                'Trade Executed: BUY',
                `Successfully bought **${sharesBought.toFixed(4)}** shares of **${symbol}**.`
            ).addFields([
                { name: 'Execution Price', value: `$${currentPrice.toFixed(2)}/share`, inline: true },
                { name: 'Total Cost', value: `$${cost.toLocaleString()}`, inline: true }
            ]);

            return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                content: '', embeds: [successEmbed]
            });
        } else {
            // amount represents shares
            const sharesToSell = amount;
            const existing = await (client.database.prisma as any).investment.findUnique({
                where: { userId_symbol: { userId, symbol } }
            });

            if (!existing || existing.shares < sharesToSell) {
                return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                    content: '',
                    embeds: [EmbedUtils.error('Portfolio Error', `You do not own **${sharesToSell}** shares of **${symbol}**. You currently own **${existing ? existing.shares.toFixed(4) : 0}** shares.`)]
                });
            }

            const revenue = sharesToSell * currentPrice;

            // Add to Bank
            await client.economy.addBank(userId, Math.floor(revenue));

            // Remove/Update Investment
            if (existing.shares - sharesToSell <= 0.0001) {
                await (client.database.prisma as any).investment.delete({ where: { id: existing.id } });
            } else {
                await (client.database.prisma as any).investment.update({
                    where: { id: existing.id },
                    data: { shares: existing.shares - sharesToSell }
                });
            }

            // Calculate Profit/Loss on this chunk
            const originalCost = sharesToSell * existing.averagePrice;
            const profit = revenue - originalCost;
            const profitMark = profit >= 0 ? '+' : '';

            const successEmbed = EmbedUtils.success(
                'Trade Executed: SELL',
                `Successfully sold **${sharesToSell.toFixed(4)}** shares of **${symbol}**.`
            ).addFields([
                { name: 'Execution Price', value: `$${currentPrice.toFixed(2)}/share`, inline: true },
                { name: 'Total Revenue', value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, inline: true },
                { name: 'Profit / Loss', value: `${profitMark}$${profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, inline: true }
            ]);

            return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                content: '', embeds: [successEmbed]
            });
        }
    }
} as Command;
