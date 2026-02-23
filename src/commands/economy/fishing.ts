import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const FISH = [
    { name: '🐟 Common Fish', value: 5 },
    { name: '🐠 Tropical Fish', value: 15 },
    { name: '🐡 Pufferfish', value: 25 },
    { name: '🦈 Shark', value: 100 },
    { name: '🐋 Whale', value: 500 },
    { name: '👢 Old Boot', value: 0 },
];

export default {
    name: 'fish-eco', // Use a different name to avoid conflict with troll fish command, aliases can be handled by command handler if implemented
    description: 'Go fishing for money.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        // ... standard cooldown logic ... 
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        if (user?.lastFish) {
            const now = new Date();
            const last = new Date(user.lastFish);
            const diff = now.getTime() - last.getTime();
            const cooldown = 5 * 60 * 1000;
            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can fish again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        const catchItem = FISH[Math.floor(Math.random() * FISH.length)] || FISH[0]!;
        const catchValue = BigInt(catchItem.value);

        await client.database.prisma.userProfile.upsert({
            where: { id: userId },
            create: { id: userId, balance: catchValue, lastFish: new Date() },
            update: {
                balance: { increment: catchValue },
                lastFish: new Date()
            }
        });

        const embed = EmbedUtils.success('Fishing', `You caught a **${catchItem.name}** worth **$${catchValue.toLocaleString()}**!`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
