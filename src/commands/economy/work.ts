import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const JOBS = [
    "You worked as a professional sky-glider pilot",
    "You sold illegal weather balloons to hobbyists",
    "You cleaned the Sentinel's optic sensors",
    "You decoded mysterious signals from the upper atmosphere",
    "You spent the hour reporting cloudy skies",
    "You successfully predicted a rain shower (it was already raining)",
    "You worked a shift at the SkyAlert Cafeteria",
    "You polished the server racks in the data center"
];

export default {
    name: 'work',
    description: 'Work a quick job to earn some money (1 hour cooldown).',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction.member?.user.id!;
        const result = await client.economy.claimWork(userId);

        if (!result.success) {
            const m = Math.floor(result.timeLeft!);
            return interaction.reply({ 
                embeds: [EmbedUtils.error('Tired?', `You are exhausted! Take a break for another **${m} minutes**.`)] 
            });
        }

        const job = JOBS[Math.floor(Math.random() * JOBS.length)];
        await interaction.reply({ 
            embeds: [EmbedUtils.success('Work Completed', `${job} and earned **$${result.reward}**! 💸`)] 
        });
    },
} as Command;
