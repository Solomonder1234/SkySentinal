import { PermissionFlagsBits, Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { CanvasUtils } from '../../utils/CanvasUtils';
import fs from 'fs';
import path from 'path';
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
        const isContinued = reasonRaw.toUpperCase().includes('CONTINUED');
        const reason = reasonRaw || 'No specific intelligence provided.';
        
        let pingType = '@here';
        let headerText = 'Special Coverage Mode Activated';
        if (isEmergency) {
            pingType = '@everyone';
            headerText = 'EMERGENCY COVERAGE ACTIVATED';
        } else if (isContinued) {
            pingType = '<@&1366111577677238322>';
            headerText = 'Special Coverage Mode Continued';
        }

        try {
            const emergencyIconPath = path.join(process.cwd(), 'Add a heading.png');
            const standardIconPath = isEmergency ? path.join(process.cwd(), 'standard_1.gif') : path.join(process.cwd(), 'standard.gif');
            
            const chosenIconPath = isEmergency && fs.existsSync(emergencyIconPath) ? emergencyIconPath : standardIconPath;
            const chosenIconName = isEmergency && fs.existsSync(emergencyIconPath) ? 'scm_emergency.png' : (isEmergency ? 'standard_1.gif' : 'standard.gif');

            try {
                const iconToSet = isEmergency ? path.join(process.cwd(), 'standard_1.gif') : path.join(process.cwd(), 'standard.gif');
                if (fs.existsSync(iconToSet)) {
                    await interaction.guild.setIcon(fs.readFileSync(iconToSet));
                }
            } catch (err) {
                client.logger.warn('Failed to dynamically mutate guild icon during SCM trigger.', err);
            }

            // Unlock Live Coverage Channel
            const liveChannel = await interaction.guild.channels.fetch(liveCoverageId);
            if (liveChannel && 'permissionOverwrites' in liveChannel) {
                await (liveChannel as any).permissionOverwrites.edit(interaction.guild.id, {
                    SendMessages: true
                });
            }

            const bannerColor = isEmergency ? '#FF0000' : (isContinued ? '#5865F2' : '#2B2D31');
            const banner = await CanvasUtils.createAlertBanner(
                headerText,
                isEmergency ? 'CRITICAL EMERGENCY PROTOCOL' : 'SPECIAL COVERAGE ALERT',
                reason,
                bannerColor
            );

            const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
            if (announceChannel && announceChannel.isTextBased()) {
                await announceChannel.send({ 
                    content: pingType, 
                    files: [banner],
                    allowedMentions: { parse: ['everyone', 'roles'] }
                });
            }

            await interaction.reply({ content: `✅ **SCM Protocols engaged (${isEmergency ? 'EMERGENCY' : (isContinued ? 'CONTINUED' : 'Standard')}). Canvas Banner broadcasted.**` });
        } catch (error) {
            client.logger.error('Error activating SCM:', error);
            await interaction.reply({ content: '❌ **Failed to engage SCM protocols.** Check permissions and logs.' });
        }
    },
} as Command;
