import { Events, GuildMember, PermissionFlagsBits } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { SkyClient } from '../lib/structures/SkyClient';

export default {
    name: Events.GuildMemberUpdate,
    run: async (client: SkyClient, oldMember: GuildMember, newMember: GuildMember) => {
        const MAIN_GUILD_ID = '1275838044531855433';
        const STAFF_HUB_CATEGORY_ID = '1276034047931453440';
        const STAFF_ROLE_ID = '1276037406696538112';

        if (newMember.guild.id !== MAIN_GUILD_ID) return;
        if (newMember.user.bot) return;

        // Detect if roles changed
        if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

        try {
            const category = newMember.guild.channels.cache.get(STAFF_HUB_CATEGORY_ID);
            if (!category) return;

            const hasAccess = newMember.permissionsIn(category).has(PermissionFlagsBits.ViewChannel);
            const hasRole = newMember.roles.cache.has(STAFF_ROLE_ID);

            if (hasAccess && !hasRole) {
                await newMember.roles.add(STAFF_ROLE_ID, 'Automated Hierarchy Enforcement: Category Access Detected').catch(() => null);
                client.logger.info(`[Event:StaffSync] Automatically granted Staff role to ${newMember.user.tag} (Real-time).`);
            }
        } catch (err) {
            client.logger.error('[Event:StaffSync] Failed real-time role enforcement:', err);
        }
    },
} as Event<Events.GuildMemberUpdate>;
