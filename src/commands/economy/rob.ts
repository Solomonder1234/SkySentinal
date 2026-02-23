import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const ROB_COOLDOWN = 5 * 60 * 1000; // 5 Minutes

export default {
    name: 'rob',
    description: 'Attempt to rob a user.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to rob.',
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    run: async (client, interaction) => {
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        let targetUser = interaction instanceof Message ? interaction.mentions.users.first() : (interaction as ChatInputCommandInteraction).options.getUser('user');

        if (!targetUser) return interaction.reply({ content: 'You must specify a user to rob!' });
        if (targetUser.id === user.id) return interaction.reply({ content: 'You cannot rob yourself!' });
        if (targetUser.bot) return interaction.reply({ content: 'You cannot rob bots!' });

        const robberProfile = await client.economy.getUserProfile(user.id);
        const victimProfile = await client.economy.getUserProfile(targetUser.id);

        const now = new Date();
        if (robberProfile.lastRob && now.getTime() - robberProfile.lastRob.getTime() < ROB_COOLDOWN) {
            const timeLeft = ROB_COOLDOWN - (now.getTime() - robberProfile.lastRob.getTime());
            const minutes = Math.ceil(timeLeft / 60000);
            return interaction.reply({
                embeds: [EmbedUtils.error('Cooldown', `You must wait **${minutes} minutes** before robbing again.`)]
            });
        }

        if (victimProfile.balance < 50n) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Too Poor', `${targetUser.username} doesn't have enough money to be worth robbing.`)]
            });
        }

        if (robberProfile.balance < 50n) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Too Poor', `You need at least $50 to attempt a robbery (for bail money).`)]
            });
        }

        // 40% Success Rate
        const success = Math.random() < 0.4;

        if (success) {
            const maxSteal = (victimProfile.balance * 3n) / 10n; // 30%
            const stealAmount = BigInt(Math.floor(Math.random() * Number(maxSteal))) + 1n;

            await client.economy.addWallet(user.id, stealAmount);
            await client.economy.removeWallet(targetUser.id, stealAmount);

            // Update Cooldown
            await client.database.prisma.userProfile.update({
                where: { id: user.id },
                data: { lastRob: now }
            });

            return interaction.reply({
                embeds: [EmbedUtils.success('Heist Successful', `You robbed **${targetUser.username}** and got away with **$${stealAmount.toLocaleString()}**! 💸`)]
            });
        } else {
            const fine = 50n;
            await client.economy.removeWallet(user.id, fine);
            // Update Cooldown
            await client.database.prisma.userProfile.update({
                where: { id: user.id },
                data: { lastRob: now }
            });

            return interaction.reply({
                embeds: [EmbedUtils.error('Busted!', `You were caught trying to rob **${targetUser.username}** and paid a **$${fine.toLocaleString()}** fine.`)]
            });
        }
    },
} as Command;
