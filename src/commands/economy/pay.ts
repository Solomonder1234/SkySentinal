import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, User, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'pay',
    description: 'Pay another user.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to pay.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'amount',
            description: 'Amount to pay.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1
        }
    ],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        let targetUser: User;
        let amount: bigint;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first() as User;
                const args = interaction.content.split(' ');
                const amountStr = args[2]; // !pay @user 100
                if (!amountStr) return interaction.reply('Please provide an amount.');
                try {
                    amount = BigInt(amountStr);
                } catch {
                    return interaction.reply('Invalid amount.');
                }
            } else {
                return interaction.reply('Please mention a user and provide an amount.');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user', true);
            amount = BigInt(chatInteraction.options.getInteger('amount', true));
        }

        if (!targetUser || amount <= 0n) return interaction.reply('Invalid arguments.');
        if (targetUser.id === userId) return interaction.reply('You cannot pay yourself.');
        if (targetUser.bot) return interaction.reply('You cannot pay bots.');

        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });
        if (!user || user.balance < amount) return interaction.reply('You do not have enough money.');

        // Transaction
        await client.database.prisma.$transaction([
            client.database.prisma.userProfile.update({
                where: { id: userId },
                data: { balance: { decrement: amount } }
            }),
            client.database.prisma.userProfile.upsert({
                where: { id: targetUser.id },
                create: { id: targetUser.id, balance: amount },
                update: { balance: { increment: amount } }
            })
        ]);

        const embed = EmbedUtils.success('Payment Successful', `You paid **$${amount.toLocaleString()}** to ${targetUser}.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
