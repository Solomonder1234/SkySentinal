import { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'retire',
    description: 'Gracefully retires a staff member, transitioning them to Formal Staff status.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true, // Preserve slash command quota
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return message.reply('This command can only be used in a server.');

        let targetId = '';
        let reason = 'Service Completion';

        if (message.mentions && message.mentions.users.size > 0) {
            targetId = message.mentions.users.first().id;
            reason = (args && args.length > 1) ? args.slice(1).join(' ') || reason : reason;
        } else if (args && args.length > 0) {
            targetId = (args[0] || '').replace(/[<@!>]/g, '');
            reason = args.slice(1).join(' ') || reason;
        }

        if (!targetId) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Target', 'Please explicitly mention the staff member you are retiring (`!retire @user [reason]`).')] });
        }

        const member = await message.guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            return message.reply({ embeds: [EmbedUtils.error('Target Missing', 'The targeted individual could not be located in this server network.')] });
        }

        const pendingMessage = await message.reply({ embeds: [EmbedUtils.info('Processing Retirement...', 'Executing role transition and prefix update...')] });

        try {
            // 1. Role Transition
            const STAFF_KEYWORDS = ['staff', 'mod', 'admin', 'management', 'supervisor', 'manager', 'director', 'lead'];
            const FORMER_STAFF_ROLE_ID = '1366441996796952657';
            const rolesToRemove = member.roles.cache.filter((r: any) => 
                STAFF_KEYWORDS.some(k => r.name.toLowerCase().includes(k)) && r.id !== FORMER_STAFF_ROLE_ID && !r.name.toLowerCase().includes('former')
            );

            // Fetch by ID to guarantee we get the correct role regardless of spelling ("Former" vs "Formal")
            const formerStaffRole = message.guild.roles.cache.get(FORMER_STAFF_ROLE_ID) 
                || message.guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'former staff' || r.name.toLowerCase() === 'formal staff');

            if (!formerStaffRole) {
                return pendingMessage.edit({ embeds: [EmbedUtils.error('Configuration Error', `The \`Former Staff\` role (ID: ${FORMER_STAFF_ROLE_ID}) does not exist in this server. Please create it first.`)] });
            }

            // Remove active staff roles
            for (const roleId of rolesToRemove.keys()) {
                await member.roles.remove(roleId).catch(() => null);
            }

            // Add Former Staff role
            await member.roles.add(formerStaffRole).catch(() => null);

            // 2. Nickname Update
            const currentName = member.nickname || member.user.username;
            // Strip existing prefix like [S], [M], [HOS] etc.
            const cleanName = currentName.replace(/^\[.*?\]\s*/, '');
            const newNickname = `[FS] ${cleanName}`.substring(0, 32);

            await member.setNickname(newNickname).catch((err: any) => {
                client.logger.warn(`Failed to set nickname for ${member.user.tag}: ${err.message}`);
            });

            // 3. Dispatch Retirement DM
            const dmEmbed = new EmbedBuilder()
                .setTitle('🎖️ Honorable Retirement')
                .setColor(0x00AAFF)
                .setDescription(`Congratulations on your retirement from the **${message.guild.name}** Staff Team.\n\nThank you for your dedicated service and contributions to the network. You have been transitioned to **Former Staff** status.\n\n**Reason for Transition:** ${reason}`)
                .setFooter({ text: 'SkyAlert Network HR Department' })
                .setTimestamp();

            let dmStatus = '`Status: Delivered`';
            try {
                await member.send({ embeds: [dmEmbed] });
            } catch (err) {
                dmStatus = '`Status: FAILED (DMs Closed)`';
            }

            // 4. Log the action
            const config = await client.database.prisma.guildConfig.findUnique({ where: { id: message.guild.id } });
            if (config && config.modLogChannelId) {
                const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    await (logChannel as any).send({
                        embeds: [EmbedUtils.info('🛡️ Staff Retirement', `**Target:** ${member.toString()} (\`${member.id}\`)\n**Moderator:** ${message.author.toString()}\n**Reason:** ${reason}\n\n**Action:** Active roles stripped, granted \`Former Staff\`, and nickname prefixed with \`[FS]\`.`).setTimestamp()]
                    }).catch(() => null);
                }
            }

            // 5. Finalize
            await pendingMessage.edit({
                embeds: [EmbedUtils.success('Retirement Finalized', `**${member.user.tag}** has been formally retired!\n\n**New Status:** Former Staff\n**Nickname:** \`${newNickname}\`\n**Retirement DM:** ${dmStatus}`)]
            });

        } catch (err: any) {
            client.logger.error(`[Retire Command] Error:`, err);
            await pendingMessage.edit({ embeds: [EmbedUtils.error('Execution Failed', `I encountered an unexpected firewall error during the retirement sequence!\n\n\`${err.message}\``)] });
        }
    }
} as Command;
