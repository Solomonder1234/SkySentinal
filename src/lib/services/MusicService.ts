import { DisTube, Queue, Song } from 'distube';
import { SkyClient } from '../structures/SkyClient';
import { Logger } from '../../utils/Logger';
import { MusicController } from '../../utils/MusicController';
import { Message, TextChannel } from 'discord.js';

export class MusicService {
    private client: SkyClient;
    private logger: Logger;
    public distube: DisTube;
    // Map to track the persistent "Now Playing" message per guild
    private controllers: Map<string, Message> = new Map();

    constructor(client: SkyClient) {
        this.client = client;
        this.logger = client.logger;

        this.distube = new DisTube(client, {
            emitNewSongOnly: true,
            savePreviousSongs: true,
            nsfw: true,
            // @ts-ignore
            youtubeCookie: process.env.YOUTUBE_COOKIE || null,
            // @ts-ignore - DisTube v4 option for ytdl-core
            ytdlOptions: {
                highWaterMark: 1 << 64, // Massive buffer to prevent code 234
                filter: 'audioonly',
                quality: 'highestaudio',
                dlChunkSize: 0,
                liveBuffer: 60000,
            }
        });

        this.setupEvents();
    }

    private setupEvents() {
        this.distube
            .on('playSong', async (queue: Queue, song: Song) => {
                this.logger.info(`[Supreme Music] Playing: ${song.name}`);
                await this.updateController(queue, song);
            })
            .on('addSong', (queue: Queue, song: Song) => {
                this.logger.info(`[Supreme Music] Added to queue: ${song.name}`);
                // Optional: Send a temporary "Added to Queue" message
            })
            .on('error', (channel: any, error: Error) => {
                this.logger.error(`[Supreme Music] Error:`, error);
                if (channel && channel.send) {
                    channel.send(`❌ **Supreme Engine Error:** \`${error.message.slice(0, 1500)}\``);
                }
            })
            .on('finish', (queue: Queue) => {
                this.logger.info(`[Supreme Music] Queue finished.`);
                this.clearController(queue.id);
            })
            .on('disconnect', (queue: Queue) => {
                this.logger.info(`[Supreme Music] Disconnected.`);
                this.clearController(queue.id);
            })
            .on('deleteQueue', (queue: Queue) => {
                this.clearController(queue.id);
            });
    }

    /**
     * Updates or creates the persistent "Now Playing" controller message.
     */
    private async updateController(queue: Queue, song: Song) {
        const guildId = queue.id;
        const channel = queue.textChannel as TextChannel;
        if (!channel) return;

        const embed = MusicController.createNowPlayingEmbed(song, queue);
        const components = MusicController.createButtonRow(queue);

        try {
            const oldMessage = this.controllers.get(guildId);
            if (oldMessage) {
                // Try to edit existing message
                await oldMessage.edit({ embeds: [embed], components }).catch(async () => {
                    // If edit fails (e.g. message deleted), send a new one
                    const newMessage = await channel.send({ embeds: [embed], components });
                    this.controllers.set(guildId, newMessage);
                });
            } else {
                const newMessage = await channel.send({ embeds: [embed], components });
                this.controllers.set(guildId, newMessage);
            }
        } catch (error) {
            this.logger.error(`[MusicService] Failed to update controller:`, error);
        }
    }

    /**
     * Removes the controller message tracking for a guild.
     */
    private clearController(guildId: string) {
        this.controllers.delete(guildId);
    }

    /**
     * Refreshes the controller (useful for manual button pushes).
     */
    public async refreshController(guildId: string) {
        const queue = this.distube.getQueue(guildId);
        if (queue && queue.songs[0]) {
            await this.updateController(queue, queue.songs[0]);
        }
    }

    // Proxy methods
    public async play(member: any, channel: any, query: string, interaction: any) {
        return this.distube.play(channel, query, {
            member,
            textChannel: interaction.channel,
            metadata: { interaction }
        });
    }

    public stop(guildId: string) {
        try {
            const queue = this.distube.getQueue(guildId);
            if (queue) {
                queue.stop();
                this.clearController(guildId);
            }
        } catch (error) {
            this.logger.error(`[MusicService] Stop failed:`, error);
        }
    }

    public async skip(guildId: string) {
        try {
            const queue = this.distube.getQueue(guildId);
            if (queue) {
                if (queue.songs.length <= 1 && !queue.autoplay) {
                    return queue.stop();
                }
                return await queue.skip();
            }
            return null;
        } catch (error) {
            this.logger.error(`[MusicService] Skip failed:`, error);
            return null;
        }
    }

    public getQueue(guildId: string) {
        return this.distube.getQueue(guildId);
    }
}
