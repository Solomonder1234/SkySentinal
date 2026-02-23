import { TextChannel, EmbedBuilder, ChannelType, GuildMember, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { SkyClient } from '../structures/SkyClient';

export class SuggestionService {
    private client: SkyClient;

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Creates a new suggestion ticket.
     */
    public async createSuggestion(member: GuildMember, content: string) {
        const guild = member.guild;
        const config = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: guild.id }
        });

        if (!config) return { success: false, message: 'Server configuration not found.' };

        try {
            // Find or create category for suggestions
            let category = guild.channels.cache.find((c: any) => c.name.toLowerCase() === 'suggestions' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'Suggestions',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['ViewChannel'] },
                        { id: (this.client.user?.id as string), allow: ['ViewChannel', 'ManageChannels'] }
                    ]
                });
            }

            // Create private channel
            const channel = await guild.channels.create({
                name: `suggest-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: (category.id as string),
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    { id: (this.client.user?.id as string), allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                ]
            });

            // Save to DB
            // @ts-ignore
            const suggestion = await this.client.database.prisma.suggestion.create({
                data: {
                    guildId: guild.id,
                    userId: member.id,
                    channelId: channel.id,
                    content: content,
                    status: 'PENDING'
                }
            });

            const embed = new EmbedBuilder()
                .setTitle('💡 New Suggestion Ticket')
                .setDescription(`**Member:** <@${member.id}>\n**Content:** ${content}\n\nStaff will review this suggestion shortly.`)
                .setColor('#5865F2' as ColorResolvable)
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(`suggest_accept_${suggestion.id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`suggest_deny_${suggestion.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`suggest_close_${suggestion.id}`).setLabel('Close Ticket').setStyle(ButtonStyle.Secondary)
            );

            await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row as any] });

            // Also log to mod log
            if (config.modLogChannelId) {
                const modChannel = guild.channels.cache.get(config.modLogChannelId) as TextChannel;
                if (modChannel) {
                    const logEmbed = EmbedUtils.info(
                        'Suggestion Created',
                        `User <@${member.id}> created a suggestion ticket in <#${channel.id}>.`
                    );
                    await modChannel.send({ embeds: [logEmbed] });
                }
            }

            return { success: true, channelId: channel.id };
        } catch (error) {
            this.client.logger.error('Failed to create suggestion:', error);
            return { success: false, message: 'An error occurred while creating your suggestion ticket.' };
        }
    }

    /**
     * Handles staff decisions on suggestions.
     */
    public async processDecision(suggestionId: number, staffMember: GuildMember, decision: 'ACCEPTED' | 'DENIED' | 'CLOSED') {
        const suggestion = await this.client.database.prisma.suggestion.findUnique({
            where: { id: suggestionId }
        });

        if (!suggestion) return { success: false, message: 'Suggestion not found.' };

        if (decision === 'CLOSED') {
            await this.client.database.prisma.suggestion.delete({ where: { id: suggestionId } });
            const channel = staffMember.guild.channels.cache.get(suggestion.channelId);
            if (channel) await channel.delete().catch(() => null);
            return { success: true };
        }

        await this.client.database.prisma.suggestion.update({
            where: { id: suggestionId },
            data: { status: decision }
        });

        const channel = staffMember.guild.channels.cache.get(suggestion.channelId) as TextChannel;
        if (channel) {
            const embed = EmbedUtils[decision === 'ACCEPTED' ? 'success' : 'error'](
                `Suggestion ${decision === 'ACCEPTED' ? 'Accepted' : 'Denied'}`,
                `Your suggestion has been **${decision.toLowerCase()}** by <@${staffMember.id}>.`
            );
            await channel.send({ embeds: [embed] });
        }

        return { success: true };
    }
}
