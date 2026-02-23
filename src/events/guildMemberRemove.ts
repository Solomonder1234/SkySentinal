import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.GuildMemberRemove,
    run: async (client, member: GuildMember | PartialGuildMember) => {
        await Logger.log(
            member.guild,
            'Member Left',
            `${member.user?.tag} (${member.id}) has left the server.`,
            'Red',
            [
                { name: 'Member Count', value: `${member.guild.memberCount}` }
            ]
        );
    },
} as Event<Events.GuildMemberRemove>;
