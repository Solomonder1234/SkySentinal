import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'strike',
    description: 'Issues a formal strike to a user (Server Owner Only).',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to strike.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the strike.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        // Enforce HOS (Head of Staff) to Founder Roles Only
        let hasPermission = false;
        if (interaction.member?.user.id === interaction.guild?.ownerId) {
            hasPermission = true;
        } else if (interaction.member && interaction.guild) {
            const memberRoles = interaction.member.roles as any;
            const guildRoles = interaction.guild.roles.cache;

            // Find the Head of Staff role to get its baseline position
            const hosRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'head of staff' || r.name.toLowerCase() === 'hos');
            const founderRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'founder');

            // If user has Administrator, let them do it just in case
            if (memberRoles.cache && memberRoles.cache.some((r: any) => r.permissions && r.permissions.has('Administrator'))) {
                hasPermission = true;
            }

            // Check if highest role is >= HOS role position
            if (hosRole && memberRoles.highest && memberRoles.highest.position >= hosRole.position) {
                hasPermission = true;
            }

            // Explicit name check just in case
            if (memberRoles.cache && memberRoles.cache.some((r: any) => ['founder', 'head of staff', 'hos'].includes(r.name.toLowerCase()))) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            const errorEmbed = EmbedUtils.error('Access Denied', 'This command is restricted to the **Head of Staff** and **Founder** roles.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        let user;
        let reason = 'No reason provided';
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user to strike.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
                reason = args.slice(1).join(' ') || 'No reason provided';
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = interaction.guild?.members.cache.get(user.id);
            reason = chatInteraction.options.getString('reason', true);
        }

        if (!interaction.guild) return;

        try {
            // Ensure GuildConfig exists
            await client.database.prisma.guildConfig.upsert({
                where: { id: interaction.guild.id },
                create: { id: interaction.guild.id },
                update: {},
            });

            // Log the strike
            const caseRecord = await client.database.prisma.case.create({
                data: {
                    guildId: interaction.guild.id,
                    targetId: user.id,
                    moderatorId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
                    type: 'STRIKE',
                    reason: reason,
                },
            });

            // Count total strikes
            const totalStrikes = await client.database.prisma.case.count({
                where: {
                    guildId: interaction.guild.id,
                    targetId: user.id,
                    type: 'STRIKE'
                }
            });

            let demotionText = "";
            let highestRole = null;
            let nextHighestRole = null;

            if (totalStrikes === 2 && member) {
                try {
                    const suspendRoleId = '1373474789653741649';

                    // 1. Remove ALL existing roles (that we can remove)
                    const rolesToRemove = member.roles.cache.filter((r: any) =>
                        r.id !== interaction.guild!.id && // Don't remove @everyone
                        r.id !== suspendRoleId && // Don't remove the role we're about to add
                        !r.managed // Don't try to remove managed roles (like bot roles)
                    );

                    if (rolesToRemove.size > 0) {
                        try {
                            await member.roles.remove(rolesToRemove);
                        } catch (e) {
                            client.logger.warn(`Failed to remove some roles from ${user.tag} during auto-suspension:`, e);
                        }
                    }

                    // 2. Assign Suspended Role
                    await member.roles.add(suspendRoleId);

                    // 3. Change Nickname to [S] prefix
                    const currentName = member.displayName;
                    let newName = currentName;

                    if (currentName.startsWith('[')) {
                        newName = currentName.replace(/^\[.*?\]\s*/, '');
                    }

                    newName = `[S] ${newName}`;
                    await member.setNickname(newName.substring(0, 32));

                    // 4. Save to database for 7 days
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                    await client.database.prisma.suspension.create({
                        data: {
                            guildId: interaction.guild.id,
                            userId: user.id,
                            moderatorId: interaction.client.user?.id || 'SYSTEM',
                            reason: 'Automatic suspension: Reached 2 formal strikes.',
                            originalName: currentName,
                            roles: JSON.stringify(rolesToRemove.map((r: any) => r.id)),
                            active: true,
                            expiresAt: expiresAt
                        }
                    });
                    demotionText = `\n\n**⚠️ 2 STRIKE PENALTY ENFORCED:**\nUser has been automatically suspended for 1 week.`;
                } catch (e) {
                    client.logger.error('Failed to suspend member for 2 strikes:', e);
                    demotionText = `\n\n**⚠️ 2 STRIKE PENALTY:** Attempted to auto-suspend user, but failed (Bot likely missing permissions).`;
                }
            } else if (totalStrikes >= 3 && member) {
                // Roles that should NEVER be removed or handed out by the strike system
                const protectedRoleNames = ['.', '→ Staff ←', 'Founder', 'Staff'];

                const sortedRoles = member.roles.cache
                    .filter((r: any) => r.id !== interaction.guild!.id && !protectedRoleNames.includes(r.name))
                    .sort((a: any, b: any) => b.position - a.position);

                if (sortedRoles.size > 0) {
                    highestRole = sortedRoles.first();

                    const guildRoles = interaction.guild!.roles.cache
                        .filter((r: any) => r.id !== interaction.guild!.id && !protectedRoleNames.includes(r.name))
                        .sort((a: any, b: any) => b.position - a.position);

                    let foundHighest = false;
                    for (const [id, role] of guildRoles) {
                        if (role.id === highestRole?.id) {
                            foundHighest = true;
                            continue;
                        }
                        if (foundHighest && !role.managed) {
                            nextHighestRole = role;
                            break;
                        }
                    }

                    if (highestRole && nextHighestRole) {
                        try {
                            await member.roles.remove(highestRole);
                            await member.roles.add(nextHighestRole);
                            demotionText = `\n\n**⚠️ 3 STRIKE PENALTY ENFORCED:**\nDemoted from <@&${highestRole.id}> to <@&${nextHighestRole.id}>.`;
                        } catch (e) {
                            client.logger.error('Failed to demote member:', e);
                            demotionText = `\n\n**⚠️ 3 STRIKE PENALTY:** Attempted to demote from <@&${highestRole.id}> to <@&${nextHighestRole.id}>, but failed (Bot likely missing permissions or role position is too high).`;
                        }
                    } else if (highestRole && !nextHighestRole) {
                        try {
                            await member.roles.remove(highestRole);
                            demotionText = `\n\n**⚠️ 3 STRIKE PENALTY ENFORCED:**\nRemoved highest role <@&${highestRole.id}> (No lower base roles found).`;
                        } catch (e) {
                            client.logger.error('Failed to demote member:', e);
                            demotionText = `\n\n**⚠️ 3 STRIKE PENALTY:** Attempted to remove <@&${highestRole.id}>, but failed.`;
                        }
                    }
                }
            }

            // Auto-format the reason
            let formattedReasonStr = reason.trim();
            if (formattedReasonStr.length > 0) {
                formattedReasonStr = formattedReasonStr.charAt(0).toUpperCase() + formattedReasonStr.slice(1);
                if (!/[.!?]$/.test(formattedReasonStr)) {
                    formattedReasonStr += '.';
                }
            }

            const strikeTitle = `Formal Strike Notice (Strike ${totalStrikes})`;

            const ansiContent = `\`\`\`ansi\n\u001b[1;36mInfraction Details & Reason\u001b[0m\n\u001b[0;34m${formattedReasonStr}\u001b[0m\n\n\u001b[1;36mModerator Notes\u001b[0m\n\u001b[0;34mThis strike has been issued due to a direct violation of server guidelines. This incident has been logged onto the user's permanent record for future review.\u001b[0m\n\n\u001b[1;36mCase ID\u001b[0m\n\u001b[1;37m#${caseRecord.id}\u001b[0m\n\`\`\``;

            const successEmbed = EmbedUtils.success(
                strikeTitle,
                `<@${user.id}> has received a formal strike.\n${ansiContent}${demotionText}`
            );

            // Log to specific channel
            try {
                const logChannelId = '1371279072067321896';
                const logChannel = await interaction.guild.channels.fetch(logChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    await logChannel.send({ embeds: [successEmbed] });
                }
            } catch (err) {
                client.logger.error('Failed to send strike log to defined channel:', err);
            }

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

            // Dm user
            try {
                const dmEmbed = EmbedUtils.error(
                    strikeTitle,
                    `You are receiving this automated message to notify you of a formal strike issued in **${interaction.guild.name}**.\n${ansiContent}${demotionText}`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore if DMs are closed
            }

        } catch (error) {
            client.logger.error(`Failed to strike user ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Strike Failed', 'An error occurred while issuing the strike.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
