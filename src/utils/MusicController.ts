import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Message,
    TextChannel
} from 'discord.js';
import { Queue, Song } from 'distube';

export class MusicController {
    // Track the persistent message per guild
    private static controllers: Map<string, Message> = new Map();

    /**
     * Create/Update the "Now Playing" controller.
     */
    public static async updateNowPlaying(queue: Queue, song: Song) {
        const guildId = queue.textChannel?.guildId;
        if (!guildId) return;

        const embed = this.createNowPlayingEmbed(song, queue);
        const components = this.createButtonRow(queue);

        try {
            const oldMessage = this.controllers.get(guildId);
            const channel = queue.textChannel as TextChannel;

            if (oldMessage && channel) {
                await oldMessage.edit({ embeds: [embed], components }).catch(async () => {
                    const newMessage = await channel.send({ embeds: [embed], components });
                    this.controllers.set(guildId, newMessage);
                });
            } else if (channel) {
                const newMessage = await channel.send({ embeds: [embed], components });
                this.controllers.set(guildId, newMessage);
            }
        } catch (error) {
            console.error(`[MusicController] Failed to update:`, error);
        }
    }

    public static createNowPlayingEmbed(song: Song, queue: Queue) {
        const embed = new EmbedBuilder()
            .setTitle(`🎶 AV Playback: ${song.name || 'Unknown'}`)
            .setURL(song.url || null)
            .setThumbnail(song.thumbnail ?? null)
            .setColor('#2F3136' as ColorResolvable)
            .addFields(
                { name: '👤 Author', value: song.uploader.name || 'Unknown', inline: true },
                { name: '⏱️ Duration', value: `\`${song.formattedDuration || 'Live'}\``, inline: true },
                { name: '🙋 Requested By', value: song.user?.toString() || 'Unknown', inline: true }
            )
            .setFooter({ text: `AV Engine v8.0.1 ALPHA • Vol: ${queue.volume}% • Filter: ${queue.filters.names.join(', ') || 'None'}`, iconURL: 'https://i.imgur.com/8Q9Pj6x.png' })
            .setTimestamp();

        return embed;
    }

    public static createButtonRow(queue: Queue) {
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('music_shuffle')
                .setLabel('🔀')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_previous')
                .setLabel('⏮️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_pause')
                .setLabel(queue.paused ? '▶️' : '⏸️')
                .setStyle(queue.paused ? ButtonStyle.Success : ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_skip')
                .setLabel('⏭️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_stop')
                .setLabel('⏹️')
                .setStyle(ButtonStyle.Danger)
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('music_loop')
                .setLabel(queue.repeatMode === 0 ? '🔁 Off' : queue.repeatMode === 1 ? '🔂 Track' : '🔁 Queue')
                .setStyle(queue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('music_vol_down')
                .setLabel('🔉 -10%')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_vol_up')
                .setLabel('🔊 +10%')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_refresh')
                .setLabel('🔄 Refresh')
                .setStyle(ButtonStyle.Primary)
        );

        const filterMenu = new StringSelectMenuBuilder()
            .setCustomId('music_filters_select')
            .setPlaceholder('✨ Select Audio Filters')
            .setMinValues(0)
            .setMaxValues(1)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bassboost')
                    .setValue('bassboost')
                    .setEmoji('🎸'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Nightcore')
                    .setValue('nightcore')
                    .setEmoji('✨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Vaporwave')
                    .setValue('vaporwave')
                    .setEmoji('🌊'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Clear')
                    .setValue('clear')
                    .setEmoji('🧹')
            );

        const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(filterMenu);

        return [row1, row2, row3];
    }
}
