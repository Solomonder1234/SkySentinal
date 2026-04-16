import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'daily',
    description: 'Claim your daily reward of $500.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction.member?.user.id!;
        const result = await client.economy.claimDaily(userId);

        if (!result.success) {
            const h = Math.floor(result.timeLeft!);
            const m = Math.floor((result.timeLeft! % 1) * 60);
            return interaction.reply({ 
                embeds: [EmbedUtils.error('Patience!', `You have already claimed your daily reward. Come back in **${h}h ${m}m**.`)] 
            });
        }

        await interaction.reply({ 
            embeds: [EmbedUtils.success('Daily Reward', `You claimed your daily bonus of **$${result.reward}**! 💰`)] 
        });
    },
} as Command;
