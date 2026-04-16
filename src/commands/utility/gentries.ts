import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'gentries',
    description: 'Displays a complete list of all users joined in a specific giveaway.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        const messageId = args[0] || '';
        if (!messageId) {
            return message.reply({ embeds: [EmbedUtils.error('Missing ID', 'Please provide the Message ID of the giveaway.')] });
        }

        const giveaway = await client.database.prisma.giveaway.findUnique({
            where: { id: messageId }
        });

        if (!giveaway) {
            return message.reply({ embeds: [EmbedUtils.error('Not Found', `I couldn't find any giveaway records for Message ID \`${messageId}\`.`)] });
        }

        const entries: string[] = JSON.parse(giveaway.entries);

        if (entries.length === 0) {
            return message.reply({ embeds: [EmbedUtils.error('No Entries', `There are currently no participants in the giveaway for **${giveaway.prize}**.`)] });
        }

        // Split mentions into multiple embeds if the list is too long for one (Max 40 per embed for readability)
        const chunks = [];
        for (let i = 0; i < entries.length; i += 40) {
            chunks.push(entries.slice(i, i + 40).map(id => `• <@${id}> (\`${id}\`)`).join('\n'));
        }

        const embeds = chunks.map((chunk, index) => {
            return EmbedUtils.premium(
                `Giveaway Participants ${chunks.length > 1 ? `(${index + 1}/${chunks.length})` : ''}`,
                `**Prize:** ${giveaway.prize}\n**Total Entries:** \`${entries.length}\`\n\n${chunk}`
            ).setColor(0x5865F2);
        });

        await message.reply({ embeds });
    }
} as Command;
