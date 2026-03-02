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
    public static async adminLog(client: any, embed: EmbedBuilder) {
        const adminChannels = ['1386829462422949889', '1371279072067321896'];
        for (const id of adminChannels) {
            const channel = (client.channels.cache.get(id) || await client.channels.fetch(id).catch(() => null)) as TextChannel;
            if (channel) await channel.send({ embeds: [embed] }).catch(() => { });
        }
    }

    public static async log(guild: Guild, title: string, description: string, color: ColorResolvable = 'Blue', fields: { name: string, value: string, inline?: boolean }[] = []) {
        const client = guild.client as any;
        const serverLogChannels = ['1275910056428179499', '1386829343644323870'];

        const embed = EmbedUtils.premium(title, description)
            .setThumbnail(guild.iconURL() || null);

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        for (const id of serverLogChannels) {
            const channel = (client.channels.cache.get(id) || await client.channels.fetch(id).catch(() => null)) as TextChannel;
            if (channel) await channel.send({ embeds: [embed] }).catch(() => { });
        }
    }
}
