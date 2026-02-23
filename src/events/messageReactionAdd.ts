import { MessageReaction, PartialMessageReaction, PartialUser, User, Events } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { SkyClient } from '../lib/structures/SkyClient';
import { EmbedUtils } from '../utils/EmbedUtils';

export default {
    name: Events.MessageReactionAdd,
    run: async (client: SkyClient, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        if (user.bot) return;

        // Handle Partials
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the reaction:', error);
                return;
            }
        }

        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        const { message } = reaction;
        const guildId = message.guildId;
        if (!guildId) return;

        const guildConfig = await client.database.prisma.guildConfig.findUnique({
            where: { id: guildId },
            include: { reactionRoles: true }
        });
        if (!guildConfig) return;

        // --- Handle Reaction Roles ---
        const rr = guildConfig.reactionRoles.find(r => r.messageId === message.id && r.emoji === reaction.emoji.name);
        if (rr) {
            const member = await message.guild?.members.fetch(user.id);
            if (member) {
                try {
                    await member.roles.add(rr.roleId);
                } catch (err) {
                    console.error('Failed to add reaction role:', err);
                }
            }
        }

        // --- Handle Starboard ---
        if (reaction.emoji.name === '⭐' && guildConfig.starboardChannelId) {
            const stars = reaction.count || 0;
            if (stars >= guildConfig.starboardThreshold) {
                const starboardChannel = message.guild?.channels.cache.get(guildConfig.starboardChannelId);
                if (!starboardChannel || !starboardChannel.isTextBased()) return;

                const existingStar = await client.database.prisma.starredMessage.findUnique({
                    where: { originalMessageId: message.id }
                });

                const embed = EmbedUtils.info(message.author?.username || 'Unknown', message.content || '[No Content]')
                    .setAuthor({
                        name: message.author?.username || 'Unknown',
                        iconURL: message.author?.displayAvatarURL() as string || ''
                    })
                    .addFields([
                        { name: 'Source', value: `[Jump to message](${message.url})`, inline: true },
                        { name: 'Channel', value: `<#${message.channelId}>`, inline: true }
                    ])
                    .setColor('#f1c40f')
                    .setTimestamp(message.createdAt)
                    .setFooter({ text: `ID: ${message.id} • Starboard` });

                if (message.attachments.size > 0) {
                    const attachment = message.attachments.first();
                    if (attachment?.contentType?.startsWith('image/')) {
                        embed.setImage(attachment.url);
                    }
                }

                const starText = `${stars} ⭐ | <#${message.channelId}>`;

                if (existingStar) {
                    try {
                        const sbMsg = await (starboardChannel as any).messages.fetch(existingStar.starboardMessageId);
                        if (sbMsg) {
                            await sbMsg.edit({ content: starText, embeds: [embed] });
                            await client.database.prisma.starredMessage.update({
                                where: { id: existingStar.id },
                                data: { stars }
                            });
                        }
                    } catch (err) {
                        console.error('Failed to edit starboard message:', err);
                    }
                } else {
                    const sbMsg = await (starboardChannel as any).send({ content: starText, embeds: [embed] });
                    await client.database.prisma.starredMessage.create({
                        data: {
                            guildId,
                            originalMessageId: message.id,
                            starboardMessageId: sbMsg.id,
                            stars
                        }
                    });
                }
            }
        }
    }
} as Event<Events.MessageReactionAdd>;
