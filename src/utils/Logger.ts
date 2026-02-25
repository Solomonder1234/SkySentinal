import winston from 'winston'
import { Guild, TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';
import { EmbedUtils } from './EmbedUtils';


export class Logger {
    private logger: winston.Logger;
    private static instance: Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message }: winston.Logform.TransformableInfo) => {
                    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ],
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public info(message: string, ...meta: any[]) {
        this.logger.info(message, ...meta);
    }

    public error(message: string, ...meta: any[]) {
        this.logger.error(message, ...meta);
    }

    public warn(message: string, ...meta: any[]) {
        this.logger.warn(message, ...meta);
    }

    public debug(message: string, ...meta: any[]) {
        this.logger.debug(message, ...meta);
    }

    // Discord Channel Logging
    private static async getLogChannel(guild: Guild): Promise<TextChannel | null> {
        try {
            const client = guild.client as any;

            // GLOBAL ADMIN REPORTING OVERRIDE (For Staff Server logging all moderation actions)
            const globalAdminChannel = (client.channels.cache.get('1386829462422949889') || await client.channels.fetch('1386829462422949889').catch(() => null)) as TextChannel;
            if (globalAdminChannel) return globalAdminChannel;

            if (client.database) {
                const config = await client.database.getGuildConfig(guild.id);
                if (config?.modLogChannelId) {
                    const channel = guild.channels.cache.get(config.modLogChannelId) as TextChannel;
                    if (channel) return channel;
                }
            }
        } catch (e) {
            // Ignore DB errors and fall back to name
        }

        const channel = guild.channels.cache.find((c: any) =>
            c.name === 'logs' || c.name === 'mod-logs') as TextChannel;
        return channel || null;
    }

    public static async log(guild: Guild, title: string, description: string, color: ColorResolvable = 'Blue', fields: { name: string, value: string, inline?: boolean }[] = []) {
        const channel = await this.getLogChannel(guild);
        if (!channel) return;

        // Original code:
        // const embed = new EmbedBuilder()
        //     .setAuthor({ name: title, iconURL: 'https://i.imgur.com/vHqXvU6.png' })
        //     .setDescription(description)
        //     .setColor(color)
        //     .setFooter({ text: 'SkySentinel v5.5.0 • System Log' })
        //     .setTimestamp();

        // Applying the requested change, adapting to the log method's parameters
        const embed = EmbedUtils.premium(title, description)
            .setThumbnail(guild.iconURL() || null); // Use guild.iconURL() instead of interaction.guild?.iconURL()

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        await channel.send({ embeds: [embed] }).catch(() => { });
    }
}
