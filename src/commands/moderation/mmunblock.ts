import { Message, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'mmunblock',
    description: '🔓 Lift a Modmail restriction from a user.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    prefixOnly: true,
    run: async (client, message, args) => {
        if (!args || !args[0]) {
            return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a User ID or mention a user to unblock.')] });
        }

        const userId = args[0].replace(/[<@!>]/g, '');

        // Find active block
        const activeBlock = await client.database.prisma.case.findFirst({
            where: {
                guildId: message.guildId!,
                targetId: userId,
                type: 'MODMAIL_BLOCK',
                active: true
            }
        });

        if (!activeBlock) {
            return message.reply({ embeds: [EmbedUtils.error('Not Restricted', 'That user does not have an active Modmail blacklist record.')] });
        }

        // Deactivate
        await client.database.prisma.case.update({
            where: { id: activeBlock.id },
            data: { active: false }
        });

        return message.reply({ embeds: [EmbedUtils.success('Modmail Restored', `Modmail access has been restored for <@${userId}> (ID: \`${userId}\`).`)] });
    }
} as Command;
