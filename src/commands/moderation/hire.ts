import { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { Logger } from '../../utils/Logger';

// You can edit this link manually!
const STAFF_SERVER_INVITE = "https://discord.gg/URd5UBJ3Wz"; 

export default {
    name: 'hire',
    description: 'Officially hires a user as Staff, grants required roles, and initiates the 24-hr server join deadline.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true, // Bypass the 100 slash command limit quota
    run: async (client, interaction, args) => {
        // Support both slash command params and prefix command args
        const message = interaction as any;
        if (!message.guild) return message.reply('This command can only be used in a server.');

        // Extract target from mention or string ID
        let targetId = '';
        if (message.mentions && message.mentions.users.size > 0) {
            targetId = message.mentions.users.first().id;
        } else if (args && args.length > 0) {
            targetId = (args[0] || '').replace(/[<@!>]/g, '');
        }

        if (!targetId) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Target', 'Please mention the user you want to hire (`!hire @user`).')] });
        }

        const member = await message.guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            return message.reply({ embeds: [EmbedUtils.error('Target Missing', 'I could not find that user in the server. Are they still here?')] });
        }

        // Attempt to find the specific administrative roles
        let staffRole = message.guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'staff');
        let trialStaffRole = message.guild.roles.cache.find((r: any) => r.name.toLowerCase() === '[ts] | trial staff');

        const rolesToGrant = [];
        if (staffRole) rolesToGrant.push(staffRole);
        if (trialStaffRole) rolesToGrant.push(trialStaffRole);

        if (rolesToGrant.length === 0) {
            return message.reply({ embeds: [EmbedUtils.error('Roles Missing', 'I could not find the `Staff` or `Trial Staff` roles in the server! Ensure they are spelled correctly in the server settings.')] });
        }

        const pendingMessage = await message.reply({ embeds: [EmbedUtils.info('Processing...', 'Initiating official employment protocols...')] });

        try {
            // Give them the roles
            await member.roles.add(rolesToGrant);

            // Set Nickname Format: [TS] | <Nickname>
            const newNick = `[TS] | ${member.displayName}`;
            await member.setNickname(newNick.substring(0, 32)).catch((err: any) => {
                client.logger.warn(`Could not set nickname for ${member.id}: ${err.message}`);
            });

            // Register them in the 7-day Auto-Demote Deadline engine natively tied into Prisma
            const expirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 Week from now
            
            await client.database.prisma.pendingStaffJoin.create({
                data: {
                    guildId: message.guild.id,
                    userId: member.id,
                    roles: JSON.stringify(rolesToGrant.map(r => r.id)),
                    expiresAt: expirationTime
                }
            });

            // Dispatch Employment Briefing to their Direct Messages
            const dmEmbed = new EmbedBuilder()
                .setTitle('🎉 You have been Hired!')
                .setColor(0x00FF00)
                .setDescription(`Congratulations, you have been officially hired as a Staff Member in **${message.guild.name}**!\n\n⚠️ **MANDATORY REQUIREMENT:**\nYou will be fired within a week if you are **NOT IN** the staff server.\n\n🔗 **Join Here:** ${STAFF_SERVER_INVITE}`)
                .setFooter({ text: 'Automated HR Operations' })
                .setTimestamp();

            let dmStatus = '`Status: Delivered`';
            try {
                await member.send({ embeds: [dmEmbed] });
            } catch (err) {
                dmStatus = '`Status: FAILED (DMs Closed)`';
                client.logger.warn(`Could not DM hired user ${member.id} (DMs closed).`);
            }

            // Finish
            const roleList = rolesToGrant.map(r => r.name).join(', ');

            // High-Fidelity Administrative Logging
            await Logger.modLog(
                message.guild,
                'Staff Hiring',
                message.member,
                member,
                'Officially inducted into the staff network.',
                [
                    { name: '📋 Roles', value: `\`${roleList}\``, inline: true },
                    { name: '📊 Display', value: `\`${newNick}\``, inline: true }
                ],
                'Green'
            );

            await pendingMessage.edit({
                embeds: [EmbedUtils.success('Employment Finalized', `**${member.user.tag}** has been officially inaugurated!\n\n**Clearances Granted:** \`${roleList}\`\n**Employment Briefing DM:** ${dmStatus}\n**Deadline Active:** The user has exactly **7 days** to join the staff network.`)]
            });

        } catch (err: any) {
            client.logger.error(`[Hire Command] Error hiring ${member.id}:`, err);
            await pendingMessage.edit({ embeds: [EmbedUtils.error('Execution Failed', `I encountered an unexpected firewall error during the hiring sequence!\n\n\`${err.message}\``)] });
        }
    }
} as Command;
