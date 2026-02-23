import { Events, GuildMember } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.GuildMemberAdd,
    run: async (client, member: GuildMember) => {
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
