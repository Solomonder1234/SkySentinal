import { Message, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'mmblacklist',
    description: '📋 View all users currently restricted from Modmail.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    prefixOnly: true,
    run: async (client, message) => {
        const activeBlocks = await client.database.prisma.case.findMany({
            where: {
                guildId: message.guildId!,
                type: 'MODMAIL_BLOCK',
                active: true
            },
            take: 25 // Limit to avoid hitting embed limits
        });

        if (activeBlocks.length === 0) {
            return message.reply({ embeds: [EmbedUtils.info('Modmail Blacklist', 'There are currently no users restricted from using the Modmail system.')] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🚫 Modmail Blacklist')
            .setColor('#2B2D31')
            ;

        let description = '';
        for (const block of activeBlocks) {
            const expires = block.duration 
                ? `<t:${Math.floor((block.createdAt.getTime() + block.duration) / 1000)}:R>` 
                : '`Permanent`';

            description += `**ID:** \`${block.targetId}\`\n**Expires:** ${expires}\n**Reason:** ${block.reason}\n\n`;
        }

        embed.setDescription(description || 'Empty list.');

        if (activeBlocks.length === 25) {
            embed;
        }

        return message.reply({ embeds: [embed] });
    }
} as Command;
