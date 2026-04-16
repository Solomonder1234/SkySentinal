import { PermissionFlagsBits, Message, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const SCM_ICON_URL = 'https://cdn.discordapp.com/attachments/1377647385093734521/1378033940555890859/standard.gif?ex=69dfb01e&is=69de5e9e&hm=fe00e0f07922f0cff4e8553e5dc543a44a077719c65543f09b7215c550796c5e&';

export default {
    name: 'scm',
    description: 'Activate Special Coverage Mode (SCM).',
    permissions: [PermissionFlagsBits.Administrator],
    category: 'Configuration',
    run: async (client, interaction) => {
        if (!interaction.guild || !(interaction instanceof Message)) return;

        const announceChannelId = '1276237463823581275';
        const liveCoverageId = '1374744878134722671';
        const reasonRaw = interaction.content.split(' ').slice(1).join(' ');
        const isEmergency = reasonRaw.toUpperCase().includes('EMERGENCY');
        const reason = reasonRaw || 'No specific intelligence provided.';
        const pingType = isEmergency ? '@everyone' : '@here';

        try {
            await interaction.guild.setIcon(SCM_ICON_URL);

            // Unlock Live Coverage Channel
            const liveChannel = await interaction.guild.channels.fetch(liveCoverageId);
            if (liveChannel && 'permissionOverwrites' in liveChannel) {
                await (liveChannel as any).permissionOverwrites.edit(interaction.guild.id, {
                    SendMessages: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('SkySentinel • AV Intelligence Module')
                .setDescription(`### ❖ ${isEmergency ? 'EMERGENCY COVERAGE ACTIVATED' : 'Special Coverage Mode Activated'}!\n\n${reason}\n**# ⚠ | special-coverage** (<#${liveCoverageId}>) is now unlocked!\n\n${pingType}`)
                .setColor(isEmergency ? 0xff0000 : 0xf04747)
                .setImage(SCM_ICON_URL)
                .setFooter({ text: `SkySentinel Emergency Protocol • ${isEmergency ? 'CRITICAL ALERT' : 'Level 1 Warning'}` })
                .setTimestamp();

            const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
            if (announceChannel && announceChannel.isTextBased()) {
                const payload: any = { embeds: [embed] };
                await announceChannel.send(payload);
            }

            await interaction.reply({ content: `✅ **SCM Protocols engaged (${isEmergency ? 'EMERGENCY' : 'Standard'}). Announcement broadcasted.**` });
        } catch (error) {
            client.logger.error('Error activating SCM:', error);
            await interaction.reply({ content: '❌ **Failed to engage SCM protocols.** Check permissions and logs.' });
        }
    },
} as Command;
