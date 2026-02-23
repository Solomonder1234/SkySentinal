import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const LOCATIONS = ['couch', 'pocket', 'street', 'car', 'grass', 'mailbox'];

export default {
    name: 'search',
    description: 'Search for money.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        // Cooldown Check (5 minutes)
        if (user?.lastSearch) {
            const now = new Date();
            const last = new Date(user.lastSearch);
            const diff = now.getTime() - last.getTime();
            const cooldown = 5 * 60 * 1000;

            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can search again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        const amount = BigInt(Math.floor(Math.random() * 31)); // 0 - 30 (fixed inclusive)
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

        await client.database.prisma.userProfile.upsert({
            where: { id: userId },
            create: { id: userId, balance: amount, lastSearch: new Date() },
            update: {
                balance: { increment: amount },
                lastSearch: new Date()
            }
        });

        if (amount === 0n) {
            const embed = EmbedUtils.info('Search', `You searched the **${location}** but found nothing.`);
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = EmbedUtils.success('Search', `You searched the **${location}** and found **$${amount.toLocaleString()}**!`);
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
