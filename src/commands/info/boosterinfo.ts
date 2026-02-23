import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'boosterinfo',
    description: 'Get information about server boosters.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        const boosters = interaction.guild.members.cache.filter(m => m.premiumSince !== null);
        const count = interaction.guild.premiumSubscriptionCount || 0;
        const level = interaction.guild.premiumTier;

        const embed = EmbedUtils.info('Server Boosts', 'Current server enrichment and tier status.')
            .setColor('Purple')
            .addFields(
                { name: 'Level', value: `\`${level}\``, inline: true },
                { name: 'Total Boosts', value: `\`${count}\``, inline: true },
                { name: 'Boosters', value: boosters.size > 0 ? boosters.map(m => m.user.tag).join(', ').slice(0, 1000) : 'None', inline: false }
            )
            .setFooter({ text: 'SkySentinel Supreme • Boosting Service' });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
