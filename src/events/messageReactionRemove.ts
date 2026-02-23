import { MessageReaction, PartialMessageReaction, PartialUser, User, Events } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { SkyClient } from '../lib/structures/SkyClient';

export default {
    name: Events.MessageReactionRemove,
    run: async (client: SkyClient, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        if (user.bot) return;

        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const { message } = reaction;
        const guildId = message.guildId;
        if (!guildId) return;

        const guildConfig = await client.database.prisma.guildConfig.findUnique({
            where: { id: guildId },
            include: { reactionRoles: true }
        });
        if (!guildConfig) return;

        // --- Handle Reaction Role Removal ---
        const rr = guildConfig.reactionRoles.find(r => r.messageId === message.id && r.emoji === reaction.emoji.name);
        if (rr) {
            const member = await message.guild?.members.fetch(user.id);
            if (member) {
                try {
                    await member.roles.remove(rr.roleId);
                } catch (err) {
                    console.error('Failed to remove reaction role:', err);
                }
            }
        }

        // --- Handle Starboard Update ---
        if (reaction.emoji.name === '⭐' && guildConfig.starboardChannelId) {
            const stars = reaction.count || 0;
            const existingStar = await client.database.prisma.starredMessage.findUnique({
                where: { originalMessageId: message.id }
            });

            if (existingStar) {
                const starboardChannel = message.guild?.channels.cache.get(guildConfig.starboardChannelId);
                if (!starboardChannel || !starboardChannel.isTextBased()) return;

                try {
                    const sbMsg = await (starboardChannel as any).messages.fetch(existingStar.starboardMessageId);
                    if (sbMsg) {
                        if (stars === 0) {
                            await sbMsg.delete();
                            await client.database.prisma.starredMessage.delete({ where: { id: existingStar.id } });
                        } else {
                            const starText = `${stars} ⭐ | <#${message.channelId}>`;
                            await sbMsg.edit({ content: starText });
                            await client.database.prisma.starredMessage.update({
                                where: { id: existingStar.id },
                                data: { stars }
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to update starboard message on remove:', err);
                }
            }
        }
    }
} as Event<Events.MessageReactionRemove>;
