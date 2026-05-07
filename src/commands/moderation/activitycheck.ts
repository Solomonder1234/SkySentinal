import { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'activitycheck',
    description: 'Deploys an official Staff Activity Verification check into the channel.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild || !message.channel) return;

        const checkEmbed = EmbedUtils.premium(
            '🚨 ACTIVITY VERIFICATION CHECK 🚨',
            '**Attention Members & Staff:**\n\nTo ensure our community remains fully active and operational, please physically confirm your activity status by clicking the validation button below.\n\n*If you fail to validate your activity through this panel or through natural server engagement within 14 days, the automated HR system will systematically revoke your clearances (for staff) or flag your profile for cleanup (for members).*'
        ).setColor('#2B2D31');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_activity_verify')
                .setLabel('✅ Mark Active')
                .setStyle(ButtonStyle.Success)
        );

        try {
            await message.delete().catch(() => null); // Delete the admin's trigger message to make it clean
            const sent = await message.channel.send({
                embeds: [checkEmbed],
                components: [row]
            });

            const reply = await message.channel.send(`✅ **Activity Check Deployed.**\nMessage ID: \`${sent.id}\` (Use this for \`!activityresults <ID>\`)`);
            // Delete the helper message after 10 seconds to keep the channel clean
            setTimeout(() => reply.delete().catch(() => null), 10000);
        } catch (err: any) {
            client.logger.error('[ActivityCheck] Failed to deploy check:', err);
            await message.channel.send('❌ Encountered an error deploying the Activity Check.');
        }
    }
} as Command;
