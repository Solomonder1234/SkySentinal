import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { MAIN_TO_STAFF_ROLE_MAP, STAFF_TO_MAIN_ROLE_MAP, MAIN_GUILD_ID, STAFF_GUILD_ID } from '../config';

export default {
    name: Events.GuildMemberUpdate,
    run: async (client: any, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
        if (client.logger) client.logger.info(`[AutoSync Debug] Detected role update for ${newMember.user.tag} in Guild ${newMember.guild.id}`);

        // --- AUTO-ROLE SYNC ON PROMOTION ---
        if (newMember.guild.id === MAIN_GUILD_ID) {
            // This update occurred in the Main Server. Find the Staff Server in cache.
            const staffGuild = client.guilds.cache.get(STAFF_GUILD_ID);

            if (staffGuild) {
                try {
                    const staffMember = await staffGuild.members.fetch(newMember.id).catch(() => null);
                    if (staffMember) {
                        const rolesToAdd: string[] = [];
                        const rolesToRemove: string[] = [];
                        const expectedStaffRoles = new Set<string>();

                        // Calculate which IDs the user mathematically SHOULD have right now.
                        newMember.roles.cache.forEach((role: any) => {
                            const mappedStaffId = MAIN_TO_STAFF_ROLE_MAP[role.id];
                            if (mappedStaffId && staffGuild.roles.cache.has(mappedStaffId)) {
                                expectedStaffRoles.add(mappedStaffId);
                            }
                        });

                        expectedStaffRoles.forEach(id => {
                            if (!staffMember.roles.cache.has(id)) {
                                rolesToAdd.push(id);
                            }
                        });

                        const allPossibleStaffRoleIds = Object.values(MAIN_TO_STAFF_ROLE_MAP);
                        staffMember.roles.cache.forEach((role: any) => {
                            if (allPossibleStaffRoleIds.includes(role.id) && !expectedStaffRoles.has(role.id)) {
                                rolesToRemove.push(role.id);
                            }
                        });

                        if (rolesToAdd.length > 0) {
                            await staffMember.roles.add(rolesToAdd).catch((e: any) => {
                                if (client.logger) client.logger.error(`[AutoSync] Failed to ADD roles for ${newMember.user.tag}: ${e.message}`);
                            });
                        }
                        if (rolesToRemove.length > 0) {
                            await staffMember.roles.remove(rolesToRemove).catch((e: any) => {
                                if (client.logger) client.logger.error(`[AutoSync] Failed to REMOVE roles for ${newMember.user.tag}: ${e.message}`);
                            });
                        }

                        if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
                            if (client.logger) {
                                client.logger.info(`[AutoSync] Synced promotion/demotion roles for ${newMember.user.tag} in Staff Server.`);
                            }
                        }
                    }
                } catch (err) {
                    if (client.logger) client.logger.warn(`[AutoSync] Failed promotion sync for ${newMember.user.tag}: ${err}`);
                }
            }
        } else if (newMember.guild.id === STAFF_GUILD_ID) {
            // REVERSE SYNC: Staff Server -> Main Server
            const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
            if (mainGuild) {
                try {
                    const mainMember = await mainGuild.members.fetch(newMember.id).catch(() => null);
                    if (mainMember) {
                        const expectedMainRoleIds = new Set<string>();
                        newMember.roles.cache.forEach((role: any) => {
                            const mappedMainId = STAFF_TO_MAIN_ROLE_MAP[role.id];
                            if (mappedMainId && mainGuild.roles.cache.has(mappedMainId)) {
                                expectedMainRoleIds.add(mappedMainId);
                            }
                        });

                        const rolesToAdd: string[] = [];
                        const rolesToRemove: string[] = [];

                        expectedMainRoleIds.forEach(id => {
                            if (!mainMember.roles.cache.has(id)) {
                                rolesToAdd.push(id);
                            }
                        });

                        const allPossibleMainRoleIds = Object.values(STAFF_TO_MAIN_ROLE_MAP);
                        mainMember.roles.cache.forEach((role: any) => {
                            if (allPossibleMainRoleIds.includes(role.id) && !expectedMainRoleIds.has(role.id)) {
                                rolesToRemove.push(role.id);
                            }
                        });

                        if (rolesToAdd.length > 0) {
                            await mainMember.roles.add(rolesToAdd).catch((e: any) => {
                                if (client.logger) client.logger.error(`[AutoSync REVERSE] Failed to ADD roles in Main Server: ${e.message}`);
                            });
                        }
                        if (rolesToRemove.length > 0) {
                            await mainMember.roles.remove(rolesToRemove).catch((e: any) => {
                                if (client.logger) client.logger.error(`[AutoSync REVERSE] Failed to REMOVE roles in Main Server: ${e.message}`);
                            });
                        }
                        if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
                            if (client.logger) {
                                client.logger.info(`[AutoSync REVERSE] Synced tracking profile for ${newMember.user.tag} securely back to Main Server.`);
                            }
                        }
                    }
                } catch (err) {
                    if (client.logger) client.logger.warn(`[AutoSync REVERSE] Failed reverse sync for ${newMember.user.tag}: ${err}`);
                }
            }
        }
        // --- END AUTO-ROLE SYNC ---
    }
};
