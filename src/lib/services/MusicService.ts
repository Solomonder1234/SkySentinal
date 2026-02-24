import { DisTube, Song, Queue } from 'distube';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { SkyClient } from '../structures/SkyClient';
import { Logger } from '../../utils/Logger';
import { MusicController } from '../../utils/MusicController';
import { TextChannel, GuildMember, VoiceBasedChannel } from 'discord.js';

// Import ffmpeg-static for a guaranteed stable binary path
const ffmpegPath = require('ffmpeg-static');

export class MusicService {
    private client: SkyClient;
    private logger: Logger;
    public distube: DisTube;

    constructor(client: SkyClient) {
        this.client = client;
        this.logger = client.logger;

        this.logger.info(`[AV Music] Using FFmpeg binary: ${ffmpegPath}`);

        this.distube = new DisTube(client, {
            emitNewSongOnly: true,
            emitAddSongWhenCreatingQueue: false,
            emitAddListWhenCreatingQueue: false,
            plugins: [
                new YtDlpPlugin({ update: false }),
            ],
            youtubeCookie: undefined,
        });

        this.setupEvents();
    }

    private setupEvents() {
        console.log('[AV Music] Setting up DisTube events (v5)...');

        const tube = this.distube as any;

        tube.on('playSong', async (queue: Queue, song: Song) => {
            console.log(`[AV Music] playSong: ${song.name}`);
            this.logger.info(`[AV Music] Playing: ${song.name}`);
            await MusicController.updateNowPlaying(queue, song);
        });

        tube.on('addSong', (queue: Queue, song: Song) => {
            console.log(`[AV Music] addSong: ${song.name}`);
            this.logger.info(`[AV Music] Added to queue: ${song.name}`);
        });

        tube.on('error', (error: Error, queue: Queue, song?: Song) => {
            console.error(`[AV Music] DisTube Global Error:`, error);
            this.logger.error(`[AV Music] Error (Queue: ${queue?.id}):`, error);

            const channel = queue?.textChannel;
            if (channel && channel.send) {
                channel.send(`❌ **AV Engine Error:** \`${error.message.slice(0, 1000)}\``).catch(() => { });
            }
        });

        tube.on('empty', (queue: Queue) => {
            console.log('[AV Music] Channel empty');
            this.logger.info(`[AV Music] Channel empty, leaving.`);
        });

        tube.on('finish', (queue: Queue) => {
            console.log('[AV Music] Queue finished');
            this.logger.info(`[AV Music] Queue finished.`);
        });

        tube.on('disconnect', (queue: Queue) => {
            console.log('[AV Music] Disconnected');
            this.logger.info(`[AV Music] Disconnected.`);
        });

        tube.on('ffmpegDebug', (debug: string) => {
            // Log ALL FFmpeg info for debugging code 1
            console.log(`[AV Music] FFmpeg Debug: ${debug}`);
            this.logger.info(`[AV Music] FFmpeg Debug: ${debug}`);
        });
    }

    public async play(member: GuildMember, channel: VoiceBasedChannel, query: string, interaction: any) {
        console.log(`[AV Music] play() request: "${query}"`);
        try {
            await this.distube.play(channel, query, {
                member: member,
                textChannel: interaction.channel as TextChannel,
                metadata: { interaction }
            });
            console.log('[AV Music] play() initiated.');
        } catch (error: any) {
            console.error('[AV Music] play() failed:', error);
            this.logger.error(`[MusicService] Play Error:`, error);
            throw error;
        }
    }

    public stop(guildId: string) {
        const queue = this.distube.getQueue(guildId);
        if (queue) {
            queue.stop();
        }
    }

    public async skip(guildId: string) {
        const queue = this.distube.getQueue(guildId);
        if (queue) {
            if (queue.songs.length <= 1 && !queue.autoplay) {
                queue.stop();
                return true;
            }
            await queue.skip();
            return true;
        }
        return false;
    }

    public getQueue(guildId: string) {
        return this.distube.getQueue(guildId);
    }

    public async refreshController(guildId: string) {
        const queue = this.distube.getQueue(guildId);
        if (queue && queue.songs[0]) {
            await MusicController.updateNowPlaying(queue, queue.songs[0]);
        }
    }
}
