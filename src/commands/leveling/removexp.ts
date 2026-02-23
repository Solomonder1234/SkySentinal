import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'removexp',
    description: 'Remove XP from a user.',
    category: 'Leveling',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'user',
            description: 'The user to remove XP from.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'amount',
            description: 'The amount of XP to remove.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let targetUser: User;
        let amount: bigint;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                return interaction.reply({ content: 'Please mention a user.' });
            }
            if (!args[1]) return interaction.reply({ content: 'Please provide an amount.' });
            try {
                amount = BigInt(args[1]);
            } catch {
                return interaction.reply({ content: 'Please provide a valid amount.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user', true);
            amount = BigInt(chatInteraction.options.getInteger('amount', true));
        }

        const userProfile = await client.database.prisma.userProfile.upsert({
            where: { id: targetUser.id },
            create: { id: targetUser.id, xp: 0n, level: 0 },
            update: { xp: { decrement: amount } }
        });

        // Ensure XP doesn't go below 0
        if (userProfile.xp < 0n) {
            await client.database.prisma.userProfile.update({
                where: { id: targetUser.id },
                data: { xp: 0n }
            });
            userProfile.xp = 0n;
        }

        const embed = EmbedUtils.success('XP Removed', `Removed **${amount.toLocaleString()} XP** from ${targetUser}. They now have **${userProfile.xp.toLocaleString()} XP**.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
