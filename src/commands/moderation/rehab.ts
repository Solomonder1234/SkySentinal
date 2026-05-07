import { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder, ChannelType, TextChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'rehab',
    description: 'Throw a rule-breaker into AI Rehabilitation Protocol.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        let targetId = '';
        let reason = 'Behavioral Correction Needed';

        if (message.mentions && message.mentions.users.size > 0) {
            targetId = message.mentions.users.first().id;
            reason = (args && args.length > 1) ? args.slice(1).join(' ') || reason : reason;
        } else if (args && args.length > 0) {
            targetId = (args[0] || '').replace(/[<@!>]/g, '');
            reason = args.slice(1).join(' ') || reason;
        }

        if (!targetId) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Target', 'Mention the user you want to send to rehab (`!rehab @user [reason]`).')] });
        }

        const member = await message.guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            return message.reply({ embeds: [EmbedUtils.error('Target Missing', 'The user could not be found.')] });
        }

        const existingSession = await (client.database.prisma as any).rehabSession.findFirst({
            where: { guildId: message.guild.id, userId: member.id }
        });

        if (existingSession) {
            return message.reply({ embeds: [EmbedUtils.error('Already In Rehab', 'This user is already trapped in the Rehabilitation Zone.')] });
        }

        // Store and strip roles
        const exemptRoles = [message.guild.roles.everyone.id];
        // Don't strip roles that are managed (bot roles / nitro booster roles)
        const managedRoles = member.roles.cache.filter((r: any) => r.managed).map((r: any) => r.id);
        const rolesToRemove = member.roles.cache.filter((r: any) => !exemptRoles.includes(r.id) && !managedRoles.includes(r.id));

        const originalRolesArray = Array.from(rolesToRemove.keys());

        try {
            for (const roleId of originalRolesArray) {
                await member.roles.remove(roleId).catch(() => {});
            }

            // Create Rehabilitation Channel
            let category = message.guild.channels.cache.find((c: any) => c.name === 'Rehabilitation Zone' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await message.guild.channels.create({
                    name: 'Rehabilitation Zone',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: message.guild.id, deny: ['ViewChannel'] },
                        { id: client.user!.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                    ]
                });
            }

            const cleanName = member.user.username.replace(/[^a-z0-9]/gi, '').toLowerCase();
            const rehabChannel = await message.guild.channels.create({
                name: `rehab-${cleanName}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    { id: message.guild.roles.everyone.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    { id: client.user!.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                ]
            });

            await (client.database.prisma as any).rehabSession.create({
                data: {
                    guildId: message.guild.id,
                    userId: member.id,
                    channelId: rehabChannel.id,
                    originalRoles: JSON.stringify(originalRolesArray),
                    reason: reason
                }
            });

            // Send instructions
            const embed = new EmbedBuilder()
                .setTitle('⚖️ MANDATORY REHABILITATION INITIATED ⚖️')
                .setColor('#2B2D31')
                .setDescription(`Welcome to the Rehabilitation Zone, <@${member.id}>.\n\nYou have been placed here by the Administration.\n\n**Reason:** ${reason}\n\n**HOW TO ESCAPE:**\nTo unlock your account and receive your roles back, you must type a sincere, genuine apology of at least **50 words**. Explain what you did wrong and how you will improve.\n\n*Be warned: Your apology will be evaluated by SkySentinel's AI Engine. Sarcasm, trolling, or ChatGPT-generated essays will be detected and instantly rejected.*`);

            await rehabChannel.send({ content: `<@${member.id}>`, embeds: [embed] });

            return message.reply({ embeds: [EmbedUtils.success('Rehab Initiated', `${member.user.tag} has been stripped of their ranks and locked in ${rehabChannel}. They are at the mercy of the AI.`)] });

        } catch (err: any) {
            client.logger.error('Failed to initiate rehab:', err);
            return message.reply({ embeds: [EmbedUtils.error('Execution Failed', 'Could not complete the rehab initialization.')] });
        }
    }
} as Command;
