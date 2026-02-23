import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 Hours
const DAILY_AMOUNT = 500n;

export default {
    name: 'daily',
    description: 'Claim your daily reward.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        const profile = await client.economy.getUserProfile(userId);

        const now = new Date();
        if (profile.lastDaily && now.getTime() - profile.lastDaily.getTime() < DAILY_COOLDOWN) {
            const timeLeft = DAILY_COOLDOWN - (now.getTime() - profile.lastDaily.getTime());
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.ceil((timeLeft % 3600000) / 60000);
            return interaction.reply({
                embeds: [EmbedUtils.error('Already Claimed', `You can claim your daily reward in **${hours}h ${minutes}m**.`)]
            });
        }

        // Update DB
        await client.database.prisma.userProfile.update({
            where: { id: userId },
            data: {
                balance: { increment: DAILY_AMOUNT },
                lastDaily: now
            }
        });

        return interaction.reply({
            embeds: [EmbedUtils.success('Daily Reward', `You claimed your daily reward of **$${DAILY_AMOUNT.toLocaleString()}**! 💰`)]
        });
    },
} as Command;
