import { DisTube, Queue, Song, Events } from 'distube';
import { YtDlpPlugin } from '@distube/yt-dlp';
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
            plugins: [new YtDlpPlugin()],
            emitNewSongOnly: true,
            savePreviousSongs: true,
            nsfw: true
        });

        this.setupEvents();
    }

    private setupEvents() {
        this.distube
            .on(Events.PLAY_SONG, async (queue: Queue, song: Song) => {
                this.logger.info(`[Supreme Music] Playing: ${song.name}`);
                await this.updateController(queue, song);
            })
            .on(Events.ADD_SONG, (queue: Queue, song: Song) => {
                this.logger.info(`[Supreme Music] Added to queue: ${song.name}`);
                // Optional: Send a temporary "Added to Queue" message
            })
            .on(Events.ERROR, (error: Error, queue: Queue, song?: Song) => {
                this.logger.error(`[Supreme Music] Error:`, error);
                const channel = queue.textChannel;
                if (channel) {
                    channel.send(`❌ **Supreme Engine Error:** \`${error.message.slice(0, 1500)}\``);
                }
                this.clearController(queue.id);
            })
            .on(Events.FINISH, (queue: Queue) => {
                this.logger.info(`[Supreme Music] Queue finished.`);
                this.clearController(queue.id);
            })
            .on(Events.DISCONNECT, (queue: Queue) => {
                this.logger.info(`[Supreme Music] Disconnected.`);
                this.clearController(queue.id);
            })
            .on(Events.DELETE_QUEUE, (queue: Queue) => {
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
