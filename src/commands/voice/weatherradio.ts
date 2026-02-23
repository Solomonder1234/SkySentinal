import { Command } from '../../lib/structures/Command';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, StreamType, entersState } from '@discordjs/voice';
import { EmbedUtils } from '../../utils/EmbedUtils';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

// Station List
// Source: https://weatherradio.org/
import { stations } from '../../data/stations';

export default {
    name: 'weatherradio',
    description: 'Play NOAA Weather Radio in a voice channel.',
    category: 'Voice',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Connect, // Needs Connect/Speak
    options: [
        {
            name: 'play',
            description: 'Play a weather station.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'station',
                    description: 'The station key (e.g., nyc, la). Use /weatherradio list to see all.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    // choices removed to support >25 stations
                }
            ]
        },
        {
            name: 'stop',
            description: 'Stop playing and disconnect.',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'list',
            description: 'List available stations.',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;
        let stationKey: string | null = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const arg0 = args[0]?.toLowerCase();

            if (!arg0) {
                subcommand = 'list';
            } else if (['stop', 'list'].includes(arg0)) {
                subcommand = arg0;
            } else if (arg0 === 'play') {
                subcommand = 'play';
                stationKey = args[1]?.toLowerCase() || null;
            } else if (stations[arg0]) {
                // If the first argument is a valid station, assume 'play'
                subcommand = 'play';
                stationKey = arg0;
            } else {
                return interaction.reply({ content: 'Invalid subcommand or station. Use: `play <station>`, `stop`, `list`, or just `<station>`' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            if (subcommand === 'play') stationKey = chatInteraction.options.getString('station');
        }

        const userTag = interaction instanceof Message ? interaction.author.tag : interaction.user.tag;
        // console.log(`[WeatherRadio] Command executed by ${userTag}. Subcommand: ${subcommand}`); // Reduce noise
        if (stationKey) console.log(`[WeatherRadio] Station request: ${stationKey}`);

        if (subcommand === 'list') {
            const grouped: { [state: string]: string[] } = {};

            // Sort keys alphabetically
            const sortedKeys = Object.keys(stations).sort();

            for (const key of sortedKeys) {
                const station = stations[key];
                if (!station) continue;

                const state = station.state || 'Other';
                if (!grouped[state]) grouped[state] = [];
                grouped[state].push(`\`${key}\`: ${station.name}`);
            }

            const embeds = [];
            let currentEmbed = EmbedUtils.info('🎙️ Available Weather Stations', 'Use `!weatherradio <station>` or `/weatherradio play <station>`');
            let fieldCount = 0;

            // Sort states alphabetically
            const sortedStates = Object.keys(grouped).sort();

            for (const state of sortedStates) {
                const list = grouped[state];
                if (!list) continue;

                if (fieldCount >= 25) {
                    embeds.push(currentEmbed);
                    currentEmbed = EmbedUtils.info('🎙️ Available Weather Stations (Cont.)', 'More stations...');
                    fieldCount = 0;
                }

                // Ensure field value doesn't exceed 1024 chars - shouldn't be an issue with this split
                currentEmbed.addFields({ name: state, value: list.join('\n'), inline: true });
                fieldCount++;
            }

            embeds.push(currentEmbed);

            return interaction.reply({ embeds: embeds });
        }

        if (subcommand === 'stop') {
            const connection = getVoiceConnection(interaction.guildId!);
            if (connection) {
                // Mark as manual stop to prevent auto-reconnect
                (connection as any).manualStop = true;
                console.log(`[WeatherRadio] Stopping playback and destroying connection in guild: ${interaction.guildId}`);
                connection.destroy();
                return interaction.reply({ content: '🛑 Stopped playback and disconnected.' });
            } else {
                return interaction.reply({ content: 'I am not currently playing anything.' });
            }
        }

        if (subcommand === 'play') {
            if (!stationKey || !stations[stationKey]) {
                return interaction.reply({ content: 'Invalid station. Use `list` to see available stations.' });
            }

            const member = interaction.member as GuildMember;
            if (!member.voice.channel) {
                return interaction.reply({ content: 'You must be in a voice channel to use this command.' });
            }

            // At this point we know stationKey is valid and stations[stationKey] exists
            const station = stations[stationKey]!;
            const channel = member.voice.channel;

            // Permission Check
            const permissions = channel.permissionsFor(client.user!);
            if (!permissions?.has(PermissionFlagsBits.Connect)) {
                return interaction.reply({ content: 'I do not have permission to **Connect** to this voice channel.' });
            }
            if (!permissions?.has(PermissionFlagsBits.Speak)) {
                return interaction.reply({ content: 'I do not have permission to **Speak** in this voice channel.' });
            }

            try {
                // Defer reply if it takes time to connect
                if (!(interaction instanceof Message)) await interaction.deferReply();

                // Helper to play stream
                const playStream = async (conn: any, url: string) => {
                    if (conn.manualStop) return;
                    console.log(`[WeatherRadio] Starting native ffmpeg process for ${url}`);
                    try {
                        const ffmpegPath = require('ffmpeg-static');
                        const { spawn } = require('child_process');

                        // Extremely bare-minimum FFmpeg call just for audio out.
                        const ffmpeg = spawn(ffmpegPath, [
                            '-reconnect', '1',
                            '-reconnect_streamed', '1',
                            '-reconnect_delay_max', '5',
                            '-i', url,
                            '-f', 'mp3',
                            '-ar', '48000',
                            '-ac', '2',
                            'pipe:1'
                        ]);

                        // Dump all errors to console immediately
                        ffmpeg.stderr.on('data', (d: any) => console.log(`[FFMPEG STREAM] ${d.toString().trim()}`));
                        ffmpeg.on('error', (err: any) => console.error('[FFMPEG FATAL] ', err));
                        ffmpeg.on('close', (code: any) => console.log(`[FFMPEG Process Closed] Code: ${code}`));

                        const resource = createAudioResource(ffmpeg.stdout, {
                            inputType: StreamType.Arbitrary,
                            inlineVolume: true,
                        });

                        const player = createAudioPlayer();
                        conn.subscribe(player);
                        player.play(resource);

                        player.on('stateChange', (oldState: any, newState: any) => {
                            console.log(`[PlayerState] ${oldState.status} -> ${newState.status}`);
                            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                                console.log('[WeatherRadio] Stream Idle.');
                                if (!conn.manualStop) {
                                    console.log('[WeatherRadio] Reconnecting in 3 seconds...');
                                    ffmpeg.kill('SIGKILL');
                                    setTimeout(() => playStream(conn, url), 3000);
                                } else {
                                    ffmpeg.kill('SIGKILL');
                                }
                            }
                        });

                        player.on('error', (error: any) => {
                            console.error(`[WeatherRadio] Player Error: ${error.message}`);
                            if (!conn.manualStop) {
                                ffmpeg.kill('SIGKILL');
                                setTimeout(() => playStream(conn, url), 3000);
                            }
                        });

                    } catch (e: any) {
                        console.error('[WeatherRadio] Pipeline Exception: ', e.message);
                        if (!conn.manualStop) {
                            setTimeout(() => playStream(conn, url), 5000);
                        }
                    }
                };

                // Retry Logic for Connection
                const connectWithRetry = async (retries = 3): Promise<any> => {
                    for (let attempt = 1; attempt <= retries; attempt++) {
                        try {
                            console.log(`[WeatherRadio] Connection attempt ${attempt}/${retries}...`);

                            const conn = joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild.voiceAdapterCreator,
                                selfDeaf: true,
                            });

                            // Add robust error logging
                            conn.on('error', (err) => console.error(`[WeatherRadio] Connection Error (Attempt ${attempt}):`, err));

                            await entersState(conn, VoiceConnectionStatus.Ready, 15_000);
                            return conn;
                        } catch (error) {
                            console.warn(`[WeatherRadio] Attempt ${attempt} failed. Retrying...`);
                            const existing = getVoiceConnection(channel.guild.id);
                            if (existing) existing.destroy();

                            if (attempt === retries) throw error;
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                };

                // Establish Connection
                let connection;
                try {
                    connection = await connectWithRetry();
                    console.log('[WeatherRadio] Connection is Ready!');

                    // Initialize manualStop flag
                    (connection as any).manualStop = false;

                    // Start Playback
                    playStream(connection, station.url);
                } catch (error) {
                    console.error('[WeatherRadio] All connection attempts failed.', error);
                    const msg = '❌ Failed to connect to voice channel after multiple attempts. Please check bot permissions and try again.';
                    if (interaction instanceof Message) {
                        return interaction.reply({ content: msg });
                    } else {
                        return interaction.editReply({ content: msg });
                    }
                }

                const embed = EmbedUtils.success('🎙️ Broadcasting', `Now playing **${station.name}** in ${channel}.\n**Auto-Reconnect Active** 🔄`);

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('stations')
                            .setEmoji('📻')
                            .setLabel('Stations')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('vol_down')
                            .setEmoji('🔉')
                            .setLabel('Vol -')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('mute')
                            .setEmoji('🔇')
                            .setLabel('Mute')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('vol_up')
                            .setEmoji('🔊')
                            .setLabel('Vol +')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setEmoji('🛑')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Danger)
                    );

                let replyMessage: Message;
                if (interaction instanceof Message) {
                    replyMessage = await interaction.reply({ embeds: [embed], components: [row] });
                } else {
                    replyMessage = await interaction.editReply({ embeds: [embed], components: [row] }) as Message;
                }

                // Interaction Collector for buttons
                const collector = replyMessage.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 24 * 60 * 60 * 1000 // 24 hours
                });

                let currentVolume = 1.0;
                let previousVolume = 1.0;
                let isMuted = false;

                collector.on('collect', async (i) => {
                    if (i.customId === 'stop') {
                        (connection as any).manualStop = true;
                        connection.destroy();
                        collector.stop();
                        await i.update({ content: '🛑 Playback stopped and disconnected.', embeds: [], components: [] });
                        return;
                    } else if (i.customId === 'stations') {
                        // Generate the stations list directly from the existing logic
                        const grouped: { [state: string]: string[] } = {};
                        const sortedKeys = Object.keys(stations).sort();

                        for (const key of sortedKeys) {
                            const st = stations[key];
                            if (!st) continue;
                            const state = st.state || 'Other';
                            if (!grouped[state]) grouped[state] = [];
                            grouped[state].push(`\`${key}\`: ${st.name}`);
                        }

                        const embeds = [];
                        let currentListEmbed = EmbedUtils.info('📻 Available Weather Stations', 'Use `!weatherradio <station>` or `/weatherradio play <station>` to switch.');
                        let fieldCount = 0;

                        const sortedStates = Object.keys(grouped).sort();

                        for (const state of sortedStates) {
                            const list = grouped[state];
                            if (!list) continue;

                            if (fieldCount >= 25) {
                                embeds.push(currentListEmbed);
                                currentListEmbed = EmbedUtils.info('🎙️ Available Weather Stations (Cont.)', 'More stations...');
                                fieldCount = 0;
                            }
                            currentListEmbed.addFields({ name: state, value: list.join('\n'), inline: true });
                            fieldCount++;
                        }
                        embeds.push(currentListEmbed);

                        // Send as an ephemeral reply so it doesn't clutter the main feed
                        await i.reply({ embeds: embeds, ephemeral: true });
                        return;
                    }

                    // Get the current resource
                    const player = (connection as any)._state.subscription?.player;
                    const resource = player?._state.resource;

                    if (!resource || !resource.volume) {
                        await i.reply({ content: 'Slow down! The stream is still initializing.', ephemeral: true });
                        return;
                    }

                    if (i.customId === 'vol_up') {
                        currentVolume = Math.min(currentVolume + 0.1, 2.0);
                        isMuted = false;
                        resource.volume.setVolume(currentVolume);
                    } else if (i.customId === 'vol_down') {
                        currentVolume = Math.max(currentVolume - 0.1, 0.0);
                        if (currentVolume === 0) isMuted = true;
                        resource.volume.setVolume(currentVolume);
                    } else if (i.customId === 'mute') {
                        if (isMuted) {
                            currentVolume = previousVolume || 1.0;
                            isMuted = false;
                        } else {
                            previousVolume = currentVolume;
                            currentVolume = 0;
                            isMuted = true;
                        }
                        resource.volume.setVolume(currentVolume);
                    }

                    // Update UI
                    const [stationsBtn, volDown, muteBtn, volUp, stopBtn] = row.components;
                    const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        stationsBtn as ButtonBuilder,
                        new ButtonBuilder(volDown?.data as any).setLabel(`Vol - (${Math.round(currentVolume * 100)}%)`),
                        new ButtonBuilder(muteBtn?.data as any)
                            .setLabel(isMuted ? 'Unmute' : 'Mute')
                            .setStyle(isMuted ? ButtonStyle.Success : ButtonStyle.Secondary),
                        new ButtonBuilder(volUp?.data as any).setLabel(`Vol + (${Math.round(currentVolume * 100)}%)`),
                        stopBtn as ButtonBuilder
                    );

                    await i.update({ components: [updatedRow] });
                });

                collector.on('end', () => {
                    const disabledRow = new ActionRowBuilder<ButtonBuilder>();
                    row.components.forEach(btn => disabledRow.addComponents(ButtonBuilder.from(btn as any).setDisabled(true)));
                    replyMessage.edit({ components: [disabledRow] }).catch(() => { });
                });

            } catch (error) {
                console.error(error);
                if (interaction instanceof Message) {
                    await interaction.reply({ content: 'Failed to join voice channel or play stream.' });
                } else {
                    await interaction.editReply({ content: 'Failed to join voice channel or play stream.' });
                }
            }
        }
    },
} as Command;
