import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const WORK_COOLDOWN = 60 * 60 * 1000; // 1 Hour

export default {
    name: 'work',
    description: 'Work a shift to earn some money.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        const profile = await client.economy.getUserProfile(userId);

        const now = new Date();
        if (profile.lastWork && now.getTime() - profile.lastWork.getTime() < WORK_COOLDOWN) {
            const timeLeft = WORK_COOLDOWN - (now.getTime() - profile.lastWork.getTime());
            const minutes = Math.ceil(timeLeft / 60000);
            return interaction.reply({
                embeds: [EmbedUtils.error('Tempus Fugit', `You are tired! You can work again in **${minutes} minutes**.`)]
            });
        }

        const earnings = BigInt(Math.floor(Math.random() * 151) + 50); // $50 - $200

        // Update DB
        await client.database.prisma.userProfile.update({
            where: { id: userId },
            data: {
                balance: { increment: earnings },
                lastWork: now
            }
        });

        const jobs = ['Software Developer', 'Discord Mod', 'Burger Flipper', 'Uber Driver', 'Streamer', 'Pro Gamer'];
        const job = jobs[Math.floor(Math.random() * jobs.length)];

        return interaction.reply({
            embeds: [EmbedUtils.success('Work Complete', `You worked as a **${job}** and earned **$${earnings.toLocaleString()}**! 💸`)]
        });
    },
} as Command;
