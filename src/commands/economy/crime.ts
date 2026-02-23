import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'crime',
    description: 'Commit a crime for money (high risk).',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const userId = (interaction instanceof Message) ? interaction.author.id : interaction.user.id;
        const user = await client.database.prisma.userProfile.findUnique({ where: { id: userId } });

        // Cooldown Check (10 minutes)
        if (user?.lastCrime) {
            const now = new Date();
            const last = new Date(user.lastCrime);
            const diff = now.getTime() - last.getTime();
            const cooldown = 10 * 60 * 1000;

            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return interaction.reply({ content: `You can commit a crime again in ${remaining} seconds.`, ephemeral: true });
            }
        }

        const successChance = 0.4; // 40% chance
        const isSuccess = Math.random() < successChance;

        if (isSuccess) {
            const amount = BigInt(Math.floor(Math.random() * 501) + 100); // 100 - 600
            await client.database.prisma.userProfile.upsert({
                where: { id: userId },
                create: { id: userId, balance: amount, lastCrime: new Date() },
                update: {
                    balance: { increment: amount },
                    lastCrime: new Date()
                }
            });
            const embed = EmbedUtils.success('Crime Successful', `You got away with **$${amount.toLocaleString()}**!`);
            await interaction.reply({ embeds: [embed] });
        } else {
            const fine = BigInt(Math.floor(Math.random() * 201) + 50); // 50 - 250
            // Ensure they don't go negative (optional, but let's be nice or strict)
            // Let's allow negative balance? No, just take what they have.

            await client.database.prisma.userProfile.upsert({
                where: { id: userId },
                create: { id: userId, balance: 0n, lastCrime: new Date() },
                update: {
                    balance: { decrement: fine },
                    lastCrime: new Date()
                }
            });

            const embed = EmbedUtils.error('Crime Failed', `You were caught and fined **$${fine.toLocaleString()}**!`);
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
