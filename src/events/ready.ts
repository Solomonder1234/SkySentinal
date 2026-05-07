import { Event } from '../lib/structures/Event';
import { Events, REST, Routes } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    run: async (client) => {
        client.logger.info(`Ready! Logged in as ${client.user?.tag}`);

        // Initialize Bump Service (Persistence)
        await client.bump.init().catch(err => client.logger.error('[BumpService] Init Error:', err));

        // Initialize Auto-Demotion Staff Activity Sweep
        // EMERGENCY SHUTOFF: client.activityEnforcer.start();

        // Initialize Giveaway Schedulers
        client.giveaways.startHeartbeat();

        // Global Slash Command & Database Configuration (Existing Servers)
        if (client.user?.id && process.env.DISCORD_TOKEN) {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            const truncateOptions = (options: any[]): any[] => {
                return (options || []).map(opt => ({
                    ...opt,
                    name: (opt.name || '').substring(0, 32),
                    description: (opt.description || 'No description').substring(0, 100),
                    options: opt.options ? truncateOptions(opt.options) : undefined,
                    choices: (opt.choices || []).map((choice: any) => ({
                        ...choice,
                        name: (choice.name || 'Choice').substring(0, 100),
                        value: typeof choice.value === 'string' ? choice.value.substring(0, 100) : choice.value
                    }))
                }));
            };

            const slashCommands = client.commands
                .filter(cmd => !cmd.prefixOnly && cmd.description && cmd.description.length > 0)
                .map(cmd => {
                    const obj: any = {
                        name: cmd.name.substring(0, 32),
                        description: (cmd.description || 'No description').substring(0, 100),
                        options: truncateOptions((cmd.options as any) || []),
                        type: cmd.type,
                        category: cmd.category || 'General' // Used for priority sorting
                    };
                    if (cmd.defaultMemberPermissions) {
                        obj.default_member_permissions = cmd.defaultMemberPermissions.toString();
                    }
                    return obj;
                });

            // Priority Sorting: Push Moderation, Fun, and Info to the top to ensure they are registered first
            const PRIORITY_ORDER = ['Moderation', 'Fun', 'Info', 'Economy', 'Utility'];
            slashCommands.sort((a, b) => {
                const priorityA = PRIORITY_ORDER.indexOf(a.category);
                const priorityB = PRIORITY_ORDER.indexOf(b.category);
                if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
                if (priorityA !== -1) return -1;
                if (priorityB !== -1) return 1;
                return a.name.localeCompare(b.name);
            });

            // Discord enforces a strict limit of 100 top-level slash commands per guild.
            const cappedSlashCommands = slashCommands.slice(0, 100);
            const omittedCommands = slashCommands.slice(100).map(c => c.name);

            if (omittedCommands.length > 0) {
                client.logger.warn(`Registered ${cappedSlashCommands.length} slash commands. Quota reached! ${omittedCommands.length} commands omitted from slash registration (available via ! prefix): ${omittedCommands.join(', ')}`);
            }

            for (const guild of client.guilds.cache.values()) {
                try {
                    await client.database.prisma.guildConfig.upsert({
                        where: { id: guild.id },
                        update: {},
                        create: { id: guild.id }
                    });

                    await rest.put(
                        Routes.applicationGuildCommands(client.user.id, guild.id),
                        { body: cappedSlashCommands }
                    );
                } catch (err: any) {
                    client.logger.warn(`Failed to configure/sync slash commands for guild ${guild.name}: ${err.message}`);
                }
            }
            client.logger.info(`Successfully synchronized configuration and ${cappedSlashCommands.length} slash commands across ${client.guilds.cache.size} servers.`);
        }

        // Debug Startup Message
        if (process.env.NODE_ENV === 'development') {
            const GENERAL_CHAT_ID = '1329128469166297159';
            try {
                const channel = await client.channels.fetch(GENERAL_CHAT_ID);
                if (channel && channel.isTextBased()) {
                    // @ts-ignore
                    await channel.send('⚠️ **BOT IS IN DEBUG MODE ON STARTUP** ⚠️');
                }
            } catch (err) {
                client.logger.error('Failed to send debug startup message:', err);
            }
        }

        // Set default presence to DND
        client.user?.setStatus('dnd');

        // Rotating Presence (EAS Alerts, Modmail, Watching, Stats)
        let presenceState = 0;
        setInterval(async () => {
            try {
                switch (presenceState) {
                    case 0: { // EAS Alerts
                        let alertCount = 0;
                        if (client.ai?.weatherService) {
                            alertCount = await client.ai.weatherService.getActiveAlertCount();
                        }
                        client.user?.setActivity(`${alertCount} EAS Alerts 📡`, { type: 3 });
                        presenceState = 1;
                        break;
                    }
                    case 1: { // Modmail
                        client.user?.setActivity('DM me for Modmail 📩', { type: 3 });
                        presenceState = 2;
                        break;
                    }
                    case 2: { // Member Count
                        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
                        client.user?.setActivity(`${totalMembers.toLocaleString()} members 👥`, { type: 3 });
                        presenceState = 3;
                        break;
                    }
                    case 3: { // Case Count (Database)
                        const caseCount = await client.database.prisma.case.count();
                        client.user?.setActivity(`${caseCount} administrative cases ⚖️`, { type: 3 });
                        presenceState = 4;
                        break;
                    }
                    case 4: { // Uptime
                        const uptimeMs = client.uptime || 0;
                        const hours = Math.floor(uptimeMs / 3600000);
                        const mins = Math.floor((uptimeMs % 3600000) / 60000);
                        client.user?.setActivity(`Uptime: ${hours}h ${mins}m ⏱️`, { type: 3 });
                        presenceState = 0;
                        break;
                    }
                    default: {
                        client.user?.setActivity('SkyAlert Network', { type: 3 });
                        presenceState = 0;
                    }
                }
            } catch (err) {
                client.logger.error('Failed to update presence:', err);
            }
        }, 30000);

        // Scheduler for Tempbans & Probations
        setInterval(async () => {
            try {
                const now = new Date();
                const activeCases = await client.database.prisma.case.findMany({
                    where: {
                        type: { in: ['TEMPBAN', 'PROBATION', 'MODMAIL_BLOCK'] },
                        active: true,
                    },
                });

                for (const modCase of activeCases) {
                    if (!modCase.duration) continue;
                    const expiresAt = new Date(modCase.createdAt.getTime() + modCase.duration);

                    if (now >= expiresAt) {
                        const guild = client.guilds.cache.get(modCase.guildId);
                        if (guild) {
                            try {
                                if (modCase.type === 'TEMPBAN') {
                                    await guild.members.unban(modCase.targetId, 'Tempban expired');
                                    client.logger.info(`Unbanned user ${modCase.targetId} in guild ${guild.name} (Tempban expired)`);
                                } else if (modCase.type === 'PROBATION') {
                                    await guild.members.ban(modCase.targetId, { reason: 'Probation period expired. Automatic re-ban.' });
                                    client.logger.info(`Re-banned user ${modCase.targetId} in guild ${guild.name} (Probation expired)`);
                                }
                            } catch (e) {
                                client.logger.error(`Failed to process moderation expiry for ${modCase.targetId} (${modCase.type}):`, e);
                            }
                        }

                        await client.database.prisma.case.update({
                            where: { id: modCase.id },
                            data: { active: false },
                        });
                    }
                }
            } catch (error) {
                client.logger.error('Error in moderation scheduler:', error);
            }
        }, 60000); // Check every minute

        // Scheduler for 24-hour Onboarding Kick
        setInterval(async () => {
            try {
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                for (const guild of client.guilds.cache.values()) {
                    const config = await client.database.prisma.guildConfig.findUnique({
                        where: { id: guild.id }
                    });

                    if (!config) continue;

                    const FALLBACK_UNVERIFIED_ROLE_ID = '1371788188087226428';
                    // @ts-ignore
                    const unverifiedRoleId = config.unverifiedRoleId || FALLBACK_UNVERIFIED_ROLE_ID;

                    const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                    if (!unverifiedRole) continue;

                    // Fetch members to ensure cache is 100% full before cross-referencing
                    await guild.members.fetch().catch(() => null);

                    for (const member of unverifiedRole.members.values()) {
                        if (member.joinedAt && member.joinedAt < twentyFourHoursAgo) {
                            try {
                                await member.kick('Failed to complete onboarding within 24 hours.');
                                client.logger.info(`Kicked ${member.user.tag} for 24-hour onboarding timeout.`);

                                // Clean up their channel
                                const channelName = `onboard-${member.user.username.toLowerCase()}`;
                                const onboardChannel = guild.channels.cache.find(c => c.name === channelName);
                                if (onboardChannel) {
                                    await onboardChannel.delete('Onboarding timed out and member kicked.').catch(() => null);
                                }
                            } catch (e) {
                                client.logger.error(`Failed to kick ${member.user.tag} for onboarding timeout:`, e);
                            }
                        }
                    }
                }
            } catch (error) {
                client.logger.error('Error in onboarding kicker scheduler:', error);
            }
        }, 30 * 60 * 1000); // Check every 30 minutes

        client.weatherAlerts.start();
        client.staffCompliance.start();
        client.reminders.start();
    },
} as Event<Events.ClientReady>;
