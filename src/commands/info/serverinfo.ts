import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';

export default {
    name: 'serverinfo',
    description: 'Get information about the server.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const embed = EmbedUtils.info(guild.name, 'Comprehensive server statistics and configuration summary.')
            .setThumbnail(guild.iconURL({ size: 1024 }) || null)
            .setFooter({ text: `SkySentinel Supreme • ${guild.id}` })
            .addFields(
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier})`, inline: false }
            );

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
