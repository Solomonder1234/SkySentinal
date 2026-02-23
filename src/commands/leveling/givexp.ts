import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'givexp',
    description: 'Give XP to a user.',
    category: 'Leveling',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'user',
            description: 'The user to give XP to.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'amount',
            description: 'The amount of XP to give.',
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
            create: { id: targetUser.id, xp: amount, level: 0 },
            update: { xp: { increment: amount } }
        });

        const embed = EmbedUtils.success('XP Given', `Gave **${amount.toLocaleString()} XP** to ${targetUser}. They now have **${userProfile.xp.toLocaleString()} XP**.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
