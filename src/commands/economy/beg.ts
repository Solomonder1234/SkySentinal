import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'beg',
    description: 'Beg for money.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        // Cooldown Check (3 minutes)
        if (user?.lastBeg) {
            const now = new Date();
            const last = new Date(user.lastBeg);
            const diff = now.getTime() - last.getTime();
            const cooldown = 3 * 60 * 1000;

            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can beg again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        // Random amount 0 - 50
        const amount = BigInt(Math.floor(Math.random() * 51));

        await client.database.prisma.userProfile.upsert({
            where: { id: userId },
            create: { id: userId, balance: amount, lastBeg: new Date() },
            update: {
                balance: { increment: amount },
                lastBeg: new Date()
            }
        });

        if (amount === 0n) {
            const embed = EmbedUtils.info('Begging', 'No one gave you anything. Better luck next time!');
            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = EmbedUtils.success('Begging', `Some kind soul gave you **$${amount.toLocaleString()}**!`);
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
