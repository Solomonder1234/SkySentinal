import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import { Song, Queue } from 'distube';

export class MusicController {
    /**
     * Create a AV Tier "Now Playing" embed.
     */
    public static createNowPlayingEmbed(song: Song, queue: Queue) {
        const embed = new EmbedBuilder()
            .setTitle(`🎶 AV Playback: ${song.name}`)
            .setURL(song.url ?? null)
            .setThumbnail(song.thumbnail ?? null)
            .setColor('#2F3136' as ColorResolvable)
            .addFields(
                { name: '👤 Uploader', value: song.uploader.name || 'Unknown', inline: true },
                { name: '⏱️ Duration', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '👀 Views', value: song.views?.toLocaleString() || 'N/A', inline: true },
                { name: '🙋 Requested By', value: song.user?.toString() || 'Unknown', inline: true }
            )
            .setFooter({ text: `SkySentinel AV • Vol: ${queue.volume}% • Filter: ${queue.filters.names.join(', ') || 'None'}`, iconURL: 'https://i.imgur.com/8Q9Pj6x.png' })
            .setTimestamp();

        return embed;
    }

    /**
     * Create the interactive button rows and select menu for playback control.
     */
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
                .setLabel(queue.repeatMode === 0 ? '🔁 Off' : queue.repeatMode === 1 ? '🔂 Song' : '🔁 Queue')
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
            .setPlaceholder('✨ Select Audio Filters (Toggle)')
            .setMinValues(0)
            .setMaxValues(3)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bassboost')
                    .setDescription('Deepen the frequency response.')
                    .setValue('bassboost')
                    .setEmoji('🎸')
                    .setDefault(queue.filters.has('bassboost')),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Nightcore')
                    .setDescription('Faster and higher pitch.')
                    .setValue('nightcore')
                    .setEmoji('✨')
                    .setDefault(queue.filters.has('nightcore')),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Vaporwave')
                    .setDescription('Slow and low pitch.')
                    .setValue('vaporwave')
                    .setEmoji('🌊')
                    .setDefault(queue.filters.has('vaporwave')),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Surround')
                    .setDescription('3D spatial audio effect.')
                    .setValue('surround')
                    .setEmoji('🔊')
                    .setDefault(queue.filters.has('surround')),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Clear')
                    .setDescription('Remove all active filters.')
                    .setValue('clear')
                    .setEmoji('🧹')
            );

        const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(filterMenu);

        return [row1, row2, row3];
    }
}
