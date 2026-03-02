import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'portfolio',
    description: 'View your live stock investments and P&L.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to view portfolio for (optional).',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        let targetUser = interaction instanceof Message ? interaction.author : interaction.user;
        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) targetUser = interaction.mentions.users.first()!;
        } else {
            const userOption = (interaction as ChatInputCommandInteraction).options.getUser('user');
            if (userOption) targetUser = userOption;
        }

        const msg = await interaction.reply({ content: `📊 Retrieving portfolio data for **${targetUser.username}**...` });

        const investments = await (client.database.prisma as any).investment.findMany({
            where: { userId: targetUser.id }
        });

        if (investments.length === 0) {
            return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
                content: '',
                embeds: [EmbedUtils.info('Stock Portfolio', `**${targetUser.username}** has no active stock investments.`)]
            });
        }

        let totalInvested = 0;
        let totalValue = 0;
        const fields: { name: string, value: string, inline: boolean }[] = [];

        // Fetch live prices in parallel
        const fetchPromises = investments.map(async (inv: any) => {
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${inv.symbol}`);
                const data = await res.json();
                if (!data.chart.error && data.chart.result && data.chart.result.length > 0) {
                    const currentPrice = data.chart.result[0].meta.regularMarketPrice;
                    const invested = inv.shares * inv.averagePrice;
                    const currentValue = inv.shares * currentPrice;
                    const profit = currentValue - invested;
                    const percentProfit = (profit / invested) * 100;

                    totalInvested += invested;
                    totalValue += currentValue;

                    const icon = profit >= 0 ? '🟢' : '🔴';
                    const sign = profit >= 0 ? '+' : '';

                    fields.push({
                        name: `${icon} ${inv.symbol}`,
                        value: `**Shares:** ${inv.shares.toFixed(4)}\n**Avg Price:** $${inv.averagePrice.toFixed(2)}\n**Current Price:** $${currentPrice.toFixed(2)}\n**Return:** ${sign}$${profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${sign}${percentProfit.toFixed(2)}%)`,
                        inline: true
                    });
                } else {
                    // Fallback if Yahoo API fails
                    const invested = inv.shares * inv.averagePrice;
                    totalInvested += invested;
                    totalValue += invested;
                    fields.push({
                        name: `⚪ ${inv.symbol}`,
                        value: `**Shares:** ${inv.shares.toFixed(4)}\n**Avg Price:** $${inv.averagePrice.toFixed(2)}\n*(Live price fetch failed)*`,
                        inline: true
                    });
                }
            } catch (e) {
                const invested = inv.shares * inv.averagePrice;
                totalInvested += invested;
                totalValue += invested;
                fields.push({
                    name: `⚪ ${inv.symbol}`,
                    value: `**Shares:** ${inv.shares.toFixed(4)}\n**Avg Price:** $${inv.averagePrice.toFixed(2)}\n*(API disconnected)*`,
                    inline: true
                });
            }
        });

        await Promise.all(fetchPromises);

        const totalProfit = totalValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
        const totalIcon = totalProfit >= 0 ? '📈' : '📉';
        const totalSign = totalProfit >= 0 ? '+' : '';

        const embed = EmbedUtils.info(
            `${totalIcon} ${targetUser.username}'s Portfolio`,
            `**Total Invested:** $${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n**Total Value:** $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n**Net P&L:** ${totalSign}$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${totalSign}${totalProfitPercent.toFixed(2)}%)`
        );

        if (fields.length > 0) embed.addFields(fields);

        return (interaction instanceof Message ? msg.edit.bind(msg) : interaction.editReply.bind(interaction))({
            content: '',
            embeds: [embed]
        });
    }
} as Command;
