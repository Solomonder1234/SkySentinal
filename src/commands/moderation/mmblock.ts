import { Message, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

function parseDuration(duration: string): number | null {
    const regex = /^(\d+)(s|m|h|d|w)$/;
    const match = duration.match(regex);
    if (!match) return null;

    const value = parseInt(match[1] as string);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60000;
        case 'h': return value * 3600000;
        case 'd': return value * 86400000;
        case 'w': return value * 604800000;
        default: return null;
    }
}

export default {
    name: 'mmblock',
    description: '🚫 Block a user from using the Modmail system.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    prefixOnly: true,
    run: async (client, message, args) => {
        if (!args || !args[0]) {
            return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a User ID or mention a user to block.\nUsage: `!mmblock <user> [duration] [reason]`')] });
        }

        const userId = args[0].replace(/[<@!>]/g, '');
        const targetUser = await client.users.fetch(userId).catch(() => null);

        if (!targetUser) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid User', 'Could not locate that user via ID.')] });
        }

        // Check if already blocked
        const existingBlock = await client.database.prisma.case.findFirst({
            where: {
                guildId: message.guildId!,
                targetId: userId,
                type: 'MODMAIL_BLOCK',
                active: true
            }
        });

        if (existingBlock) {
            return message.reply({ embeds: [EmbedUtils.error('Already Restricted', `**${targetUser.tag}** is already blacklisted from Modmail.`)] });
        }

        let durationMs: number | null = null;
        let reason = 'Administrative Restriction';
        let durationStr = 'Permanent';

        if (args[1]) {
            const parsed = parseDuration(args[1]);
            if (parsed) {
                durationMs = parsed;
                durationStr = args[1];
                reason = args.slice(2).join(' ') || reason;
            } else {
                reason = args.slice(1).join(' ') || reason;
            }
        }

        // Create the case in the database
        await client.database.prisma.case.create({
            data: {
                guildId: message.guildId!,
                targetId: userId,
                moderatorId: message.author.id,
                type: 'MODMAIL_BLOCK',
                reason: reason,
                duration: durationMs,
                active: true
            }
        });

        const successEmbed = EmbedUtils.success('Modmail Blacklist Active', 
            `**User:** ${targetUser.tag} (\`${targetUser.id}\`)\n**Duration:** \`${durationStr}\`\n**Reason:** ${reason}`
        );

        return message.reply({ embeds: [successEmbed] });
    }
} as Command;
