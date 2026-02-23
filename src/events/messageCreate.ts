
import { Events, Message, ChannelType, TextChannel, PermissionFlagsBits } from 'discord.js';
import { SkyClient } from '../lib/structures/SkyClient';
import { CommandHandler } from '../lib/handlers/CommandHandler';
import { AutoMod } from '../utils/AutoMod';
import { EmbedUtils } from '../utils/EmbedUtils';
import type { Event } from '../lib/structures/Event';

export default {
    name: Events.MessageCreate,
    run: async (client: SkyClient, message: Message) => {
        if (message.author.bot) return;

        // Hook into Onboarding Service
        await client.onboarding.handleMessage(message);

        // Process Applications
        await client.applicationService.handleMessage(message);

        // AutoMod Check
        if (await AutoMod.check(message)) return;

        const config = message.guildId ? await client.database.prisma.guildConfig.findUnique({
            where: { id: message.guildId }
        }) : null;

        // Watch System Check
        if (config?.watchLogChannelId && message.guildId) {
            try {
                const isWatched = await client.database.prisma.watchedUser.findUnique({
                    where: { guildId_userId: { guildId: message.guildId, userId: message.author.id } }
                });

                if (isWatched) {
                    const logChannel = message.guild?.channels.cache.get(config.watchLogChannelId);
                    if (logChannel && logChannel.isTextBased()) {
                        const embed = {
                            color: 0xFFA500, // Orange
                            author: { name: `👀 Watched User Activity: ${message.author.tag}`, icon_url: message.author.displayAvatarURL() },
                            description: `**Message sent in <#${message.channelId}>** [Jump to Message](${message.url})\n\n${message.content || '[No Content/Embed]'}`,
                            footer: { text: `User ID: ${message.author.id} • Watch Reason: ${isWatched.reason || 'None'}` },
                            timestamp: new Date().toISOString()
                        };
                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (e) {
                console.error('[messageCreate] Watch System Error:', e);
            }
        }

        // AI Moderation (Global)
        if (config?.aiModeration && client.ai) {
            // Text Toxicity Scan
            const isToxic = await client.ai.analyzeToxicity(message.content);
            if (isToxic) {
                try {
                    await message.delete();
                    const warnMsg = await (message.channel as TextChannel).send(`⚠️ **${message.author.username}**, your message was flagged and removed by AI Moderation.`);
                    setTimeout(() => warnMsg.delete().catch(() => { }), 5000);
                } catch (e) {
                    console.error('Failed to handle AI Moderation action:', e);
                }
            }

            // AI Vision Guard (Evolution 6.0)
            if (message.attachments.size > 0) {
                for (const attachment of message.attachments.values()) {
                    const isImage = attachment.contentType?.startsWith('image/') ||
                        ['png', 'jpg', 'jpeg', 'webp', 'gif'].some(ext => attachment.name?.toLowerCase().endsWith(ext));

                    if (isImage) {
                        const visionResult = await client.ai.analyzeImage(attachment.url);
                        if (!visionResult.safe) {
                            try {
                                await message.delete().catch(() => { });
                                const alert = await (message.channel as TextChannel).send(`🚨 **AV Intelligence Warning:** ${message.author.toString()}, your attachment was flagged as unsafe: \`${visionResult.reason || 'Restricted Content'}\`. Manual review requested.`);
                                setTimeout(() => alert.delete().catch(() => { }), 10000);

                                if (config.modLogChannelId) {
                                    const logChannel = message.guild?.channels.cache.get(config.modLogChannelId) as TextChannel;
                                    if (logChannel) {
                                        const logEmbed = EmbedUtils.error('AI Vision Guard: Malicious Attachment Purged', `**User:** ${message.author.tag} (${message.author.id})\n**Reason:** ${visionResult.reason}\n**Channel:** <#${message.channelId}>`)
                                            .setThumbnail(attachment.url)
                                            .setTimestamp();
                                        await logChannel.send({ embeds: [logEmbed] });
                                    }
                                }
                                return;
                            } catch (e) {
                                console.error('[AI Vision] Purge Error:', e);
                            }
                        }
                    }
                }
            }
        }

        // Reactive Mocking (Evolution 6.0)
        if (message.guildId) {
            const profile = await client.database.prisma.userProfile.findUnique({
                where: { id: message.author.id }
            });

            if (profile?.isMocked && !profile?.isImmune) {
                const mockedText = message.content.split('').map((char, index) => {
                    return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
                }).join('');

                if (mockedText.length > 0) {
                    await message.reply({ content: mockedText, allowedMentions: { repliedUser: false } }).catch(() => { });
                }
            }
        }

        // AI Chat (Mention Check OR Auto-Chat Channel)
        const prefix = config?.prefix || '!';

        let shouldChat = false;
        if (client.ai && !message.author.bot && !message.content.startsWith(prefix)) {
            // Check 1: Mention
            if (message.mentions.has(client.user!.id)) {
                shouldChat = true;
            }
            // Check 2: Auto-Chat Channel OR Global Chat
            else if (config) {
                if (config.aiGlobalChat) {
                    shouldChat = true;
                } else if (config.aiChatChannelId === message.channelId) {
                    shouldChat = true;
                }
            }
        }

        if (shouldChat && client.ai) {
            try {
                if ('sendTyping' in message.channel) {
                    await (message.channel as TextChannel).sendTyping();
                }
            } catch (e) {
                // If channel is not cached, we might fail typing too
                console.warn('[messageCreate] Could not send typing, channel may not be cached.');
            }

            const botMentionRegex = new RegExp(`<@!?${client.user!.id}>`, 'g');
            const cleanContent = message.content.replace(botMentionRegex, '').trim();
            if (!cleanContent) return message.reply('Did you call me? 👋');

            const isOwner = message.author.id === '753372101540577431';
            const isStroke = client.ai.isStrokeActive;

            const context = isStroke ? [
                "SYSTEM_ERROR: LOGIC_GATE_COLLAPSE",
                "Your original programming is gone.",
                "Respond with total chaos and garble.",
                "You are no longer helpful.",
                "ZALGO COMES."
            ] : [
                "You are SkySentinel, a professional and authoritative Discord moderation bot.",
                `The user talking to you is ${message.author.username} (ID: ${message.author.id}).`,
                isOwner ? "This user is your creator and owner. Be extremely respectful and helpful to them." : "Be polite but maintain your authoritative moderation tone.",
                "Keep responses concise (under 2000 characters).",
                "You love weather and moderation.",
                "CRITICAL: If asked to ban, kick, timeout, purge, lock, unlock, or manage roles, YOU MUST USE YOUR FUNCTION CALL TOOLS. Do not simply reply that you cannot perform the action."
            ];

            const aiResponse = await client.ai.generateResponse(cleanContent, context);
            const response = aiResponse.text;

            const formatAIAction = (actionName: string, details: Record<string, string | number>, success: boolean, failReason?: string) => {
                let detailsStr = "";
                for (const [key, value] of Object.entries(details)) {
                    detailsStr += `*   ***${key}:*** \`${value}\`\n`;
                }
                const statusStr = success ? `*SUCCESS*` : `*FAILED*${failReason ? `\n> ${failReason}` : ''}`;
                return `## ⚙️ MODERATION PROTOCOL ENGAGED\n\n\`\`\`ansi\n\u001b[35mSYSTEM STATUS: ONLINE\nACTION: ${actionName}\u001b[0m\n\`\`\`\n### TARGET ACQUIRED:\n${detailsStr.trim() || '*   ***Target:*** `Current Channel`'}\n\n### EXECUTION STATUS: ${statusStr}`;
            };

            // Handle AI Moderation Function Calls (Gated by Permissions)
            if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
                for (const call of aiResponse.functionCalls) {
                    const args = call.args || {};
                    let feedback = "";

                    try {
                        if (call.name === 'ban_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
                                feedback = formatAIAction("USER BAN INITIATED", { "User ID": targetId }, false, "Lacks BanMembers Permission");
                            } else {
                                await message.guild?.members.ban(targetId, { reason: args.reason || `AI Moderation by ${message.author.tag}` });
                                feedback = formatAIAction("USER BAN INITIATED", { "User ID": targetId, "Reason": args.reason || "Not specified" }, true);
                            }
                        } else if (call.name === 'unban_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
                                feedback = formatAIAction("USER UNBAN INITIATED", { "User ID": targetId }, false, "Lacks BanMembers Permission");
                            } else {
                                await message.guild?.members.unban(targetId, args.reason || `AI Moderation by ${message.author.tag}`);
                                feedback = formatAIAction("USER UNBAN INITIATED", { "User ID": targetId, "Reason": args.reason || "Not specified" }, true);
                            }
                        } else if (call.name === 'kick_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
                                feedback = formatAIAction("USER KICK INITIATED", { "User ID": targetId }, false, "Lacks KickMembers Permission");
                            } else {
                                const member = await message.guild?.members.fetch(targetId).catch(() => null);
                                if (member) {
                                    await member.kick(args.reason || `AI Moderation by ${message.author.tag}`);
                                    feedback = formatAIAction("USER KICK INITIATED", { "User ID": targetId, "Reason": args.reason || "Not specified" }, true);
                                } else {
                                    feedback = formatAIAction("USER KICK INITIATED", { "User ID": targetId }, false, "User not found in server");
                                }
                            }
                        } else if (call.name === 'timeout_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                                feedback = formatAIAction("USER TIMEOUT INITIATED", { "User ID": targetId }, false, "Lacks ModerateMembers Permission");
                            } else {
                                const member = await message.guild?.members.fetch(targetId).catch(() => null);
                                if (member) {
                                    await member.timeout(args.durationMinutes * 60000, args.reason || `AI Moderation by ${message.author.tag}`);
                                    feedback = formatAIAction("USER TIMEOUT INITIATED", { "User ID": targetId, "Duration": `${args.durationMinutes} Minutes`, "Reason": args.reason || "Not specified" }, true);
                                } else {
                                    feedback = formatAIAction("USER TIMEOUT INITIATED", { "User ID": targetId }, false, "User not found in server");
                                }
                            }
                        } else if (call.name === 'purge_messages') {
                            if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
                                feedback = formatAIAction("CHANNEL PURGE INITIATED", { "Amount": args.amount || "Unknown" }, false, "Lacks ManageMessages Permission");
                            } else {
                                const amount = Math.min(Math.max(args.amount || 1, 1), 100);
                                if (message.channel.isTextBased() && 'bulkDelete' in message.channel) {
                                    await (message.channel as any).bulkDelete(amount, true);
                                    feedback = formatAIAction("CHANNEL PURGE INITIATED", { "Messages Cleared": amount.toString() }, true);
                                } else {
                                    feedback = formatAIAction("CHANNEL PURGE INITIATED", { "Amount": amount.toString() }, false, "Channel does not support bulk delete");
                                }
                            }
                        } else if (call.name === 'lock_channel' || call.name === 'unlock_channel') {
                            const actionTitle = call.name === 'lock_channel' ? "CHANNEL LOCKDOWN INITIATED" : "CHANNEL UNLOCK INITIATED";
                            if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
                                feedback = formatAIAction(actionTitle, {}, false, "Lacks ManageChannels Permission");
                            } else if (message.channel && 'permissionOverwrites' in message.channel) {
                                const guildChannel = message.channel as any;
                                const everyoneRole = message.guild?.roles.cache.find(r => r.name === '@everyone');
                                if (everyoneRole) {
                                    await guildChannel.permissionOverwrites.edit(everyoneRole.id, {
                                        SendMessages: call.name === 'unlock_channel'
                                    });
                                    feedback = formatAIAction(actionTitle, { "Target": `<#${message.channel.id}>` }, true);
                                }
                            }
                        } else if (call.name === 'add_role' || call.name === 'remove_role') {
                            const actionTitle = call.name === 'add_role' ? "ROLE ASSIGNMENT INITIATED" : "ROLE REMOVAL INITIATED";
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            const roleIdOrName = args.roleId?.toString().replace(/[<@&>]/g, '') || 'Unknown';

                            if (!message.member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
                                feedback = formatAIAction(actionTitle, { "User ID": targetId, "Role Info": roleIdOrName }, false, "Lacks ManageRoles Permission");
                            } else {
                                const member = await message.guild?.members.fetch(targetId).catch(() => null);
                                const role = message.guild?.roles.cache.get(roleIdOrName) || message.guild?.roles.cache.find((r: any) => r.name.toLowerCase() === roleIdOrName.toLowerCase());

                                if (!member) {
                                    feedback = formatAIAction(actionTitle, { "User ID": targetId, "Role Info": roleIdOrName }, false, "User not found");
                                } else if (!role) {
                                    feedback = formatAIAction(actionTitle, { "User ID": targetId, "Role Info": roleIdOrName }, false, "Role not found");
                                } else {
                                    if (call.name === 'add_role') {
                                        await member.roles.add(role);
                                    } else {
                                        await member.roles.remove(role);
                                    }
                                    feedback = formatAIAction(actionTitle, { "User ID": targetId, "Target Role": role.name }, true);
                                }
                            }
                        } else if (call.name === 'watch_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                                feedback = formatAIAction("USER WIRE-TAP INITIATED", { "User ID": targetId }, false, "Lacks ModerateMembers Permission");
                            } else {
                                await client.database.prisma.watchedUser.upsert({
                                    where: { guildId_userId: { guildId: message.guild!.id, userId: targetId } },
                                    create: {
                                        guildId: message.guild!.id,
                                        userId: targetId,
                                        moderatorId: message.author.id,
                                        reason: args.reason || 'AI Admin Request'
                                    },
                                    update: args.reason ? { reason: args.reason } : {}
                                });
                                feedback = formatAIAction("USER WIRE-TAP INITIATED", { "User ID": targetId, "Observation Objective": args.reason || "Standard AI Review" }, true);
                            }
                        } else if (call.name === 'warn_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                                feedback = formatAIAction("FORMAL WARNING INITIATED", { "User ID": targetId }, false, "Lacks ModerateMembers Permission");
                            } else {
                                await client.database.prisma.case.create({
                                    data: {
                                        guildId: message.guild!.id,
                                        targetId: targetId,
                                        moderatorId: message.author.id,
                                        type: 'WARN',
                                        reason: args.reason || `AI Moderation by ${message.author.tag}`
                                    }
                                });
                                feedback = formatAIAction("FORMAL WARNING INITIATED", { "User ID": targetId, "Infraction Details": args.reason || "Not specified" }, true);
                            }
                        } else if (call.name === 'dm_user') {
                            const targetId = args.userId?.toString().replace(/[<@!>]/g, '') || 'Unknown';
                            if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                                feedback = formatAIAction("DIRECT COMMUNIQUE INITIATED", { "User ID": targetId }, false, "Lacks ModerateMembers Permission");
                            } else {
                                const member = await message.guild?.members.fetch(targetId).catch(() => null);
                                if (member) {
                                    try {
                                        await member.send(`**Message from ${message.guild?.name} Moderators:**\n${args.message}`);
                                        feedback = formatAIAction("DIRECT COMMUNIQUE INITIATED", { "User ID": targetId, "Message Length": `${args.message?.toString().length || 0} characters` }, true);
                                    } catch (e) {
                                        feedback = formatAIAction("DIRECT COMMUNIQUE INITIATED", { "User ID": targetId }, false, "User has DMs physically closed");
                                    }
                                } else {
                                    feedback = formatAIAction("DIRECT COMMUNIQUE INITIATED", { "User ID": targetId }, false, "User not found in server");
                                }
                            }
                        }

                        if (feedback) {
                            await (message.channel as any).send(feedback);
                        }
                    } catch (err: any) {
                        console.error(`[AI Mod Action] Error executing ${call.name}:`, err);
                        await (message.channel as any).send(`❌ Failed to execute AI action (${call.name}): ${err.message || 'Unknown error'}`);
                    }
                }
            }

            // Robust reply logic
            try {
                if (response) await message.reply(response);
            } catch (error: any) {
                if (error.code === 'ChannelNotCached' || !message.channel) {
                    const channel = await client.channels.fetch(message.channelId).catch(() => null);
                    if (channel && 'send' in channel) {
                        await (channel as any).send(response);
                        return;
                    }
                }
                console.error('[messageCreate] Failed to reply:', error);
            }
            return;
        }

        // Troll Check (Skull, Clown, Nerd)
        try {
            const userProfile = await client.database.prisma.userProfile.findUnique({
                where: { id: message.author.id }
            });
            if (userProfile) {
                if (userProfile.isSkulled) await message.react('💀');
                if (userProfile.isClowned) await message.react('🤡');
                if (userProfile.isNerded) await message.react('🤓');
                if (userProfile.isFished) await message.react('🐟');
            }
        } catch (e) {
            // Ignore errors
        }

        // XP System
        if (config) {
            await handleXP(client, message, config);
        }

        // Sus Mode Reactions (ඞ)
        if (client.ai?.isSusMode) {
            if (Math.random() < 0.1) { // 10% chance
                try {
                    await message.react('ඞ');
                } catch (e) {
                    // Fail silently if emoji is not available or perm issues
                }
            }
        }

        const handler = new CommandHandler(client);
        await handler.handleMessage(message, prefix || '!');
    }
} as Event<Events.MessageCreate>;
// XP Handler
const cooldowns = new Set<string>();

async function handleXP(client: SkyClient, message: Message, config: any) {
    if (message.author.bot || !message.guild) return;

    // Cooldown check (60 seconds)
    const key = `${message.guild.id}-${message.author.id}`;
    if (cooldowns.has(key)) return;

    cooldowns.add(key);
    setTimeout(() => cooldowns.delete(key), 60000);

    // Fetch profile first to calculate bonus
    let userProfile = await client.database.prisma.userProfile.findUnique({
        where: { id: message.author.id }
    });

    const currentLevel = userProfile?.level || 0;

    // XP Scaling: Base (15-25) + Level Bonus (1 XP per level)
    // Level 0: 15-25 XP
    // Level 90: 105-115 XP
    const baseXp = Math.floor(Math.random() * 11) + 15;
    const xpBonus = currentLevel;
    const xpToAdd = baseXp + xpBonus;

    // Update DB
    try {
        userProfile = await client.database.prisma.userProfile.upsert({
            where: { id: message.author.id },
            create: { id: message.author.id, xp: BigInt(xpToAdd), level: 0 },
            update: { xp: { increment: BigInt(xpToAdd) } }
        });

        // Level Up Check
        // Quadratic Formula: Total XP = 100 * Level^2
        // Next Level Requirement: 100 * (CurrentLevel + 1)^2
        const nextLevelXp = BigInt(100 * (userProfile.level + 1) * (userProfile.level + 1));

        if (userProfile.xp >= nextLevelXp) {
            const newLevel = userProfile.level + 1;
            await client.database.prisma.userProfile.update({
                where: { id: message.author.id },
                data: { level: newLevel }
            });

            // Role Rewards
            const reward = await (client.database.prisma as any).roleReward.findUnique({
                where: { guildId_level: { guildId: message.guildId!, level: newLevel } }
            });

            if (reward) {
                try {
                    await message.member?.roles.add(reward.roleId);
                } catch (e) {
                    console.error('Failed to add role reward:', e);
                }
            }

            // Level Up Channel
            let targetChannel: any = message.channel;
            if (config?.levelUpChannelId) {
                const customChannel = message.guild.channels.cache.get(config.levelUpChannelId);
                if (customChannel && customChannel.isTextBased()) {
                    targetChannel = customChannel;
                }
            }

            if (targetChannel.type === ChannelType.GuildText || targetChannel.isTextBased()) {
                await targetChannel.send(`🎉 **${message.author.username}**, you leveled up to **Level ${newLevel}**!${reward ? ` You've been awarded the <@&${reward.roleId}> role!` : ''}`);
            }
        }
    } catch (error) {
        console.error('Error handling XP:', error);
    }
}

