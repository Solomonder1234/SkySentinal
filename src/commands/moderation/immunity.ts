import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'immunity',
    description: 'Toggle troll immunity for a user (Owner Only).',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'user',
            description: 'The user to protect/unprotect.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const isOwner = interaction.guild?.ownerId === (interaction instanceof Message ? interaction.author.id : interaction.user.id);

        if (!isOwner) {
            const err = EmbedUtils.error('Access Denied', 'This command is reserved for the AV Owner.');
            return interaction.reply({ embeds: [err], ephemeral: true });
        }

        let targetUser;
        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply('Please provide a user.');
            targetUser = await client.users.fetch(userId).catch(() => null);
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user', true);
        }

        if (!targetUser) return interaction.reply('User not found.');

        const profile = await client.database.prisma.userProfile.upsert({
            where: { id: targetUser.id },
            create: { id: targetUser.id, isImmune: true },
            update: {}
        });

        const newState = !(profile as any).isImmune;

        await client.database.prisma.userProfile.update({
            where: { id: targetUser.id },
            data: {
                isImmune: newState,
                isMocked: false, // Automatically strip mock if immune
                isSkulled: false,
                isClowned: false,
                isNerded: false,
                isFished: false
            }
        });

        const embed = EmbedUtils.success(
            'Immunity Updated',
            `**${targetUser.tag}** is now **${newState ? 'IMMUNE' : 'VULNERABLE'}** to all troll features.`
        );

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
