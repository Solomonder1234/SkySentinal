import { PermissionFlagsBits, Message, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const NORMAL_ICON_URL = 'https://cdn.discordapp.com/attachments/1377647385093734521/1378033914190237696/standard_1.gif?ex=69dfb017&is=69de5e97&hm=8fdbf9edda5d6d4f24254cabbf996d6fb1e7e31863b155707f004fed6d216aff&';

export default {
    name: 'disablescm',
    description: 'Deactivate Special Coverage Mode (SCM).',
    permissions: [PermissionFlagsBits.Administrator],
    category: 'Configuration',
    run: async (client, interaction) => {
        if (!interaction.guild || !(interaction instanceof Message)) return;

        const announceChannelId = '1276237463823581275';
        const liveCoverageId = '1374744878134722671';

        try {
            await interaction.guild.setIcon(NORMAL_ICON_URL);

            // Lock Live Coverage Channel
            const liveChannel = await interaction.guild.channels.fetch(liveCoverageId);
            if (liveChannel && 'permissionOverwrites' in liveChannel) {
                await (liveChannel as any).permissionOverwrites.edit(interaction.guild.id, {
                    SendMessages: false
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('SkySentinel • AV Intelligence Module')
                .setDescription(`### ❖ Special Coverage Mode Deactivated\n\nThe event has concluded. **# ⚠ | special-coverage** (<#${liveCoverageId}>) is now locked.\n\nReturning to standard operations. Thank you for your cooperation.`)
                .setColor('#43b581') // Success green
                .setImage(NORMAL_ICON_URL)
                .setFooter({ text: 'SkySentinel Protocol • Standard Operations Resumed' })
                .setTimestamp();

            const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
            if (announceChannel && announceChannel.isTextBased()) {
                await announceChannel.send({ embeds: [embed] });
            }

            await interaction.reply({ content: '✅ **SCM Protocols stood down. Stand down broadcasted.**' });
        } catch (error) {
            client.logger.error('Error deactivating SCM:', error);
            await interaction.reply({ content: '❌ **Failed to deactivate SCM protocols.** Check permissions and logs.' });
        }
    },
} as Command;
