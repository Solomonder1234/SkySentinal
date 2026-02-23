import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const ANIMALS = [
    { name: '🐰 Rabbit', value: 10 },
    { name: '🦊 Fox', value: 20 },
    { name: '🦌 Deer', value: 50 },
    { name: '🐗 Boar', value: 80 },
    { name: '🐻 Bear', value: 150 },
    { name: '🍂 Nothing', value: 0 },
];

export default {
    name: 'hunt',
    description: 'Go hunting for money.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        if (user?.lastHunt) {
            const now = new Date();
            const last = new Date(user.lastHunt);
            const diff = now.getTime() - last.getTime();
            const cooldown = 5 * 60 * 1000;
            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can hunt again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        const catchItem = ANIMALS[Math.floor(Math.random() * ANIMALS.length)] || ANIMALS[0]!;
        const catchValue = BigInt(catchItem.value);

        await client.database.prisma.userProfile.upsert({
            where: { id: userId },
            create: { id: userId, balance: catchValue, lastHunt: new Date() },
            update: {
                balance: { increment: catchValue },
                lastHunt: new Date()
            }
        });

        const embed = EmbedUtils.success('Hunting', `You caught a **${catchItem.name}** worth **$${catchValue.toLocaleString()}**!`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
