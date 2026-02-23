import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const ITEMS = [
    { name: '🐛 Worm', value: 1 },
    { name: '🦴 Bone', value: 5 },
    { name: '💍 Ring', value: 100 },
    { name: '🪙 Coin', value: 10 },
    { name: '🪨 Rock', value: 0 },
];

export default {
    name: 'dig',
    description: 'Dig for treasure.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        if (user?.lastDig) {
            const now = new Date();
            const last = new Date(user.lastDig);
            const diff = now.getTime() - last.getTime();
            const cooldown = 5 * 60 * 1000;
            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can dig again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        const catchItem = ITEMS[Math.floor(Math.random() * ITEMS.length)] || ITEMS[0]!;
        const catchValue = BigInt(catchItem.value);

        await client.database.prisma.userProfile.upsert({
            where: { id: userId },
            create: { id: userId, balance: catchValue, lastDig: new Date() },
            update: {
                balance: { increment: catchValue },
                lastDig: new Date()
            }
        });

        const embed = EmbedUtils.success('Digging', `You dug up a **${catchItem.name}** worth **$${catchValue.toLocaleString()}**!`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
