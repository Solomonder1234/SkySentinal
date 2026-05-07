import { PermissionFlagsBits, Message, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { CanvasUtils } from '../../utils/CanvasUtils';

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

            const banner = await CanvasUtils.createAlertBanner(
                'Operational Stand-Down',
                'SPECIAL COVERAGE MODE DEACTIVATED',
                'The event has concluded. Returning to standard operations. Thank you for your cooperation.',
                '#2B2D31'
            );

            const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
            if (announceChannel && announceChannel.isTextBased()) {
                await announceChannel.send({ files: [banner] });
            }

            await interaction.reply({ content: '✅ **SCM Protocols stood down. Stand down broadcasted.**' });
        } catch (error) {
            client.logger.error('Error deactivating SCM:', error);
            await interaction.reply({ content: '❌ **Failed to deactivate SCM protocols.** Check permissions and logs.' });
        }
    },
} as Command;
