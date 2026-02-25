import { Events, GuildMember } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';
import { MAIN_TO_STAFF_ROLE_MAP, MAIN_GUILD_ID, STAFF_GUILD_ID } from '../config';

export default {
    name: Events.GuildMemberAdd,
    run: async (client, member: GuildMember) => {
        // --- AUTO-ROLE SYNC ---
        if (member.guild.id === STAFF_GUILD_ID) {
            const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
            if (mainGuild) {
                try {
                    const mainMember = await mainGuild.members.fetch(member.id).catch(() => null);
                    if (mainMember) {
                        const rolesToAdd: string[] = [];

                        mainMember.roles.cache.forEach(role => {
                            const mappedStaffId = MAIN_TO_STAFF_ROLE_MAP[role.id];
                            if (mappedStaffId && member.guild.roles.cache.has(mappedStaffId) && !rolesToAdd.includes(mappedStaffId)) {
                                rolesToAdd.push(mappedStaffId);
                            }
                        });

                        if (rolesToAdd.length > 0) {
                            await member.roles.add(rolesToAdd).catch((e: any) => {
                                client.logger.error(`[AutoSync] Failed to ADD mapped roles during join for ${member.user.tag}: ${e.message}`);
                            });
                            client.logger.info(`[AutoSync] Synced roles for ${member.user.tag} in Staff Server.`);
                        }
                    }
                } catch (err) {
                    client.logger.warn(`[AutoSync] Failed to process ${member.user.tag}: ${err}`);
                }
            }
        }
        // --- END AUTO-ROLE SYNC ---

        // Trigger Onboarding
        await client.onboarding.handleMemberJoin(member);

        await Logger.log(
            member.guild,
            'Member Joined',
            `${member.user.tag} (${member.id}) has joined the server.`,
            'Green',
            [
                { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` },
                { name: 'Member Count', value: `${member.guild.memberCount}` }
            ]
        );
    },
} as Event<Events.GuildMemberAdd>;
