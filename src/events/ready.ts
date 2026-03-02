import { Event } from '../lib/structures/Event';
import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    run: async (client) => {
        client.logger.info(`Ready! Logged in as ${client.user?.tag}`);

        // Initialize Bump Service (Persistence)
        await client.bump.init().catch(err => client.logger.error('[BumpService] Init Error:', err));

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

        // Rotating Presence (EAS Alerts, Modmail, Watching)
        let presenceState = 0;
        setInterval(async () => {
            try {
                if (presenceState === 0) {
                    let alertCount = 0;
                    if (client.ai?.weatherService) {
                        alertCount = await client.ai.weatherService.getActiveAlertCount();
                    }
                    // Type 3 is "Watching"
                    client.user?.setActivity(`${alertCount} EAS Alerts 📡`, { type: 3 });
                    presenceState = 1;
                } else if (presenceState === 1) {
                    client.user?.setActivity('DM me for Modmail 📩', { type: 3 });
                    presenceState = 2;
                } else {
                    client.user?.setActivity('SkyAlert Network', { type: 3 });
                    presenceState = 0;
                }
            } catch (err) {
                client.logger.error('Failed to update presence:', err);
            }
        }, 30000);

        // Scheduler for Tempbans
        setInterval(async () => {
            try {
                const now = new Date();
                const expiredBans = await client.database.prisma.case.findMany({
                    where: {
                        type: 'TEMPBAN',
                        active: true,
                    },
                });

                for (const ban of expiredBans) {
                    if (!ban.duration) continue;
                    const expiresAt = new Date(ban.createdAt.getTime() + ban.duration);

                    if (now >= expiresAt) {
                        const guild = client.guilds.cache.get(ban.guildId);
                        if (guild) {
                            try {
                                await guild.members.unban(ban.targetId, 'Tempban expired');
                                client.logger.info(`Unbanned user ${ban.targetId} in guild ${guild.name} (Tempban expired)`);
                            } catch (e) {
                                client.logger.error(`Failed to auto-unban ${ban.targetId}:`, e);
                            }
                        }

                        await client.database.prisma.case.update({
                            where: { id: ban.id },
                            data: { active: false },
                        });
                    }
                }
            } catch (error) {
                client.logger.error('Error in tempban scheduler:', error);
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
    },
} as Event<Events.ClientReady>;
