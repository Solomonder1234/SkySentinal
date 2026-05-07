import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { ActivityStore } from '../../utils/ActivityStore';

export default {
    name: 'activityresults',
    description: 'Retrieves the verification results for a specific Activity Check by its Message ID.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        const messageId = args[0];
        if (!messageId) {
            return message.reply({ embeds: [EmbedUtils.error('Missing ID', 'Please provide the Message ID of the Activity Check.\nExample: `!activityresults 1234567890`')] });
        }

        const verifiedUserIds = ActivityStore.getResults(messageId);

        if (verifiedUserIds.length === 0) {
            return message.reply({ embeds: [EmbedUtils.error('No Results Found', `I couldn't find any recorded verifications for Message ID \`${messageId}\`.\n\n*Make sure this is a valid ID from a deployed !activitycheck and that people have actually clicked the button.*`)] });
        }

        const userMentions = verifiedUserIds.map(id => `<@${id}>`).join('\n');

        // Split mentions into multiple embeds if the list is too long for one
        const chunks = [];
        for (let i = 0; i < verifiedUserIds.length; i += 20) {
            chunks.push(verifiedUserIds.slice(i, i + 20).map(id => `• <@${id}> (\`${id}\`)`).join('\n'));
        }

        const embeds = chunks.map((chunk, index) => {
            const embed = EmbedUtils.premium(
                `Activity Check Results ${chunks.length > 1 ? `(${index + 1}/${chunks.length})` : ''}`,
                `**ID:** \`${messageId}\`\n\n**Verified Members (${verifiedUserIds.length}):**\n${chunk}`
            ).setColor('#2B2D31');
            return embed;
        });

        await message.reply({ embeds });
    }
} as Command;
