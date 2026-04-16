import winston from 'winston'
import { Guild, TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';
import { EmbedUtils } from './EmbedUtils';

export enum LogCategory {
    Moderation = 'modLogChannelId',
    Message = 'msgLogChannelId',
    Member = 'memberLogChannelId',
    Server = 'serverLogChannelId',
    Voice = 'voiceLogChannelId',
    Join = 'joinLogChannelId',
    Watch = 'watchLogChannelId'
}

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

    // Discord Channel Logging (Admin/System)
    public static async adminLog(client: any, embed: EmbedBuilder) {
        const adminChannels = ['1386829462422949889', '1371279072067321896'];
        for (const id of adminChannels) {
            try {
                const channel = (client.channels.cache.get(id) || await client.channels.fetch(id).catch(() => null)) as TextChannel;
                if (channel) await channel.send({ embeds: [embed] }).catch(() => { });
            } catch {}
        }
    }

    /**
     * Broadcasts join/leave events to the master tracking channel
     */
    public static async masterMemberLog(client: any, embed: EmbedBuilder) {
        const masterChannelId = '1365712411641905186';
        try {
            const channel = (client.channels.cache.get(masterChannelId) || await client.channels.fetch(masterChannelId).catch(() => null)) as TextChannel;
            if (channel) await channel.send({ embeds: [embed] }).catch(() => { });
        } catch {}
    }

    // Comprehensive Guild Logging
    public static async log(
        guild: Guild, 
        title: string, 
        description: string, 
        color: ColorResolvable = 'Blue', 
        fields: { name: string, value: string, inline?: boolean }[] = [],
        category: LogCategory = LogCategory.Moderation
    ) {
        const client = guild.client as any;
        if (!client.database) return;

        try {
            const config = await client.database.prisma.guildConfig.findUnique({
                where: { id: guild.id }
            });

            if (!config || !config.enableLogging) return;

            // Determine target channel ID
            const channelId = (config[category as keyof typeof config] as string) || config.modLogChannelId;
            if (!channelId) return;

            const targetChannel = (guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null)) as TextChannel;
            if (!targetChannel) return;

            const embed = EmbedUtils.premium(title, description)
                .setThumbnail(guild.iconURL() || null)
                .setColor(color)
                .setFooter({ text: `SkySentinel Administrative Unit • ${category.replace('LogChannelId', '')}` });

            if (fields.length > 0) {
                embed.addFields(fields);
            }

            // Mirror to master join/leave tracking if category is Join
            if (category === LogCategory.Join) {
                await this.masterMemberLog(client, embed);
            }

            await targetChannel.send({ embeds: [embed] }).catch(() => { });
        } catch (err) {
            console.error('[Logger] Failed to send Discord log:', err);
        }
    }

    /**
     * Specialized High-Fidelity Moderation Log
     */
    public static async modLog(
        guild: Guild,
        action: string,
        executor: any,
        target: any,
        reason: string | null = 'No reason provided',
        extraFields: { name: string, value: string, inline?: boolean }[] = [],
        color: ColorResolvable = 'Orange'
    ) {
        const client = guild.client as any;
        const fields = [
            { name: '👤 Target', value: `${target.user?.tag || target.tag} (\`${target.id}\`)`, inline: true },
            { name: '🛡️ Executor', value: `${executor.user?.tag || executor.tag} (\`${executor.id}\`)`, inline: true },
            { name: '📝 Reason', value: reason || 'No reason provided' }
        ];

        if (extraFields.length > 0) {
            fields.push(...extraFields);
        }

        const embed = EmbedUtils.premium(`Administrative Action: ${action}`, `A security protocol has been authorized and logged by the high-command unit.`)
            .setThumbnail(guild.iconURL() || null)
            .setColor(color)
            .setFooter({ text: `SkySentinel Administrative Unit • Moderation • ${guild.name}` })
            .addFields(fields);

        // Send to master log channels
        await this.adminLog(client, embed);

        // Send to guild log channel
        await this.log(
            guild,
            `Administrative Action: ${action}`,
            `A security protocol has been authorized and logged by the high-command unit.`,
            color,
            fields,
            LogCategory.Moderation
        );
    }
}
