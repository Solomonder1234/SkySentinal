import axios from 'axios';
import { SkyClient } from '../structures/SkyClient';
import { TextChannel, EmbedBuilder } from 'discord.js';

export class WeatherAlertService {
    private client: SkyClient;
    private seenAlerts: Set<string> = new Set();
    private interval: NodeJS.Timeout | null = null;

    constructor(client: SkyClient) {
        this.client = client;
    }

    public start() {
        this.checkAlerts();
        this.interval = setInterval(() => this.checkAlerts(), 5 * 60 * 1000); // Every 5 minutes
        this.client.logger.info('[WeatherSentinel] Service started. Monitoring NWS for alerts.');
    }

    private async checkAlerts() {
        try {
            const configs = await (this.client.prisma.guildConfig as any).findMany({
                where: {
                    enableLogging: true,
                    weatherAlertChannelId: { not: null }
                }
            });

            if (configs.length === 0) return;

            // NWS API Alerts
            const url = 'https://api.weather.gov/alerts/active';
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'SkySentinelBot/1.5 (contact@skysentinel.bot)' }
            });

            const alerts = data.features;
            if (!alerts || alerts.length === 0) return;

            for (const config of (configs as any[])) {
                const guild = this.client.guilds.cache.get(config.id);
                if (!guild) continue;

                const alertChannelId = config.weatherAlertChannelId;
                if (!alertChannelId) continue;

                const targetChannel = (guild.channels.cache.get(alertChannelId) || 
                                       await guild.channels.fetch(alertChannelId).catch(() => null)) as TextChannel;
                
                if (!targetChannel) continue;

                // Filter alerts for this guild's zone
                const relevantAlerts = alerts.filter((a: any) => {
                    if (this.seenAlerts.has(a.id)) return false;
                    
                    const areaDesc = a.properties.areaDesc.toLowerCase();
                    const zone = (config.weatherAlertZone || 'NYC').toLowerCase();

                    return areaDesc.includes(zone) || 
                           (zone === 'global' && ['Extreme', 'Severe'].includes(a.properties.severity));
                });

                for (const alert of relevantAlerts) {
                    const props = alert.properties;
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`⚠️ Weather Alert: ${props.event}`)
                        .setDescription(props.description.substring(0, 2048))
                        .addFields(
                            { name: 'Severity', value: props.severity, inline: true },
                            { name: 'Urgency', value: props.urgency, inline: true },
                            { name: 'Area', value: props.areaDesc }
                        )
                        .setColor(props.severity === 'Extreme' ? '#ff0000' : '#ffa500')
                        .setTimestamp(new Date(props.effective))
                        .setFooter({ text: 'SkySentinel Weather Monitor | NWS API' });

                    await targetChannel.send({ embeds: [embed] }).catch(() => {});
                    this.seenAlerts.add(alert.id);
                }
            }

            // Cleanup old seen alerts (keep last 500)
            if (this.seenAlerts.size > 500) {
                const arr = Array.from(this.seenAlerts);
                this.seenAlerts = new Set(arr.slice(-500));
            }

        } catch (error) {
            this.client.logger.error('[WeatherSentinel] Error polling NWS:', error);
        }
    }

    public stop() {
        if (this.interval) clearInterval(this.interval);
    }
}
