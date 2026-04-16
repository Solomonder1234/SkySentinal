import { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { Logger } from '../../utils/Logger';

export default {
    name: 'fire',
    description: 'Instantly terminates a staff member, severing all administrative clearances and dispatching a notice.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true, // Bypass the 100 slash command limit quota
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return message.reply('This command can only be used in a server.');

        let targetId = '';
        let reason = 'Administrative Discretion';

        if (message.mentions && message.mentions.users.size > 0) {
            targetId = message.mentions.users.first().id;
            reason = (args && args.length > 1) ? args.slice(1).join(' ') || reason : reason;
        } else if (args && args.length > 0) {
            targetId = (args[0] || '').replace(/[<@!>]/g, '');
            reason = args.slice(1).join(' ') || reason;
        }

        if (!targetId) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Target', 'Please explicitly mention the staff member you are terminating (`!fire @user [reason]`).')] });
        }

        const member = await message.guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            return message.reply({ embeds: [EmbedUtils.error('Target Missing', 'The targeted individual could not be located in this server network.')] });
        }

        const pendingMessage = await message.reply({ embeds: [EmbedUtils.info('Processing Termination...', 'Executing role detachment protocol...')] });

        try {
            // Identify all roles the user has that classify as an administrative clearance
            const STAFF_KEYWORDS = ['staff', 'mod', 'admin', 'management'];
            
            const rolesToRemove = member.roles.cache.filter((r: any) => 
                STAFF_KEYWORDS.some(k => r.name.toLowerCase().includes(k))
            );

            if (rolesToRemove.size === 0) {
                return pendingMessage.edit({ embeds: [EmbedUtils.error('Invalid Demotion', 'That user does not possess any recognized Staff or Moderation roles.')] });
            }

            const removedRolesList = rolesToRemove.map((r: any) => r.name).join(', ');

            // Strip the roles
            for (const roleId of rolesToRemove.keys()) {
                await member.roles.remove(roleId).catch(() => null);
            }

            // If they had a pending status for the Staff Server, wipe it so the bot doesn't crash later
            await client.database.prisma.pendingStaffJoin.deleteMany({
                where: { userId: member.id, guildId: message.guild.id }
            });

            // Dispatch Termination Briefing to their Direct Messages
            const dmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Employment Terminated')
                .setColor(0xFF0000)
                .setDescription(`You have been officially terminated from your Staff position in **${message.guild.name}**.\n\n**Reason:** ${reason}\n**Clearances Revoked:** \`${removedRolesList}\``)
                .setFooter({ text: 'Automated HR Operations' })
                .setTimestamp();

            let dmStatus = '`Status: Delivered`';
            try {
                await member.send({ embeds: [dmEmbed] });
            } catch (err) {
                dmStatus = '`Status: FAILED (DMs Closed)`';
                client.logger.warn(`Could not DM fired user ${member.id} (DMs closed).`);
            }

            // High-Fidelity Administrative Logging
            await Logger.modLog(
                message.guild,
                'Staff Termination',
                message.member || message.author,
                member,
                reason,
                [
                    { name: '🔥 Roles Revoked', value: `\`${removedRolesList}\``, inline: false }
                ],
                'Red'
            );

            // Finish
            await pendingMessage.edit({
                embeds: [EmbedUtils.success('Termination Finalized', `**${member.user.tag}** has been officially removed from the staff team!\n\n**Roles Revoked:** \`${removedRolesList}\`\n**Termination DM:** ${dmStatus}`)]
            });

        } catch (err: any) {
            client.logger.error(`[Fire Command] Error terminating ${member.id}:`, err);
            await pendingMessage.edit({ embeds: [EmbedUtils.error('Execution Failed', `I encountered an unexpected firewall error during the termination sequence!\n\n\`${err.message}\``)] });
        }
    }
} as Command;
