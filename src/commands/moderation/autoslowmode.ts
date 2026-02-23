import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChatInputCommandInteraction, Message, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const activeMonitors = new Map<string, NodeJS.Timeout>();
const msgCounts = new Map<string, number>();

export default {
    name: 'autoslowmode',
    description: 'Enable dynamic slowmode based on chat frequency.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'enabled',
            description: 'Whether to enable auto-slowmode.',
            type: ApplicationCommandOptionType.Boolean,
            required: true,
        },
        {
            name: 'threshold',
            description: 'Messages per 10 seconds to trigger slowmode (default 10).',
            type: ApplicationCommandOptionType.Integer,
            required: false,
        }
    ],
    run: async (client, interaction) => {
        const channelId = interaction.channelId;
        const guildId = interaction.guildId!;
        let enabled: boolean;
        let threshold = 10;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            enabled = args[0]?.toLowerCase() === 'on';
            threshold = args[1] ? parseInt(args[1]) : threshold;
            if (isNaN(threshold)) threshold = 10;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            enabled = chatInteraction.options.getBoolean('enabled', true);
            threshold = chatInteraction.options.getInteger('threshold') || threshold;
        }

        const key = `${guildId}-${channelId}`;

        if (enabled) {
            if (activeMonitors.has(key)) return interaction.reply({ content: 'Auto-slowmode is already active in this channel.' });

            const interval = setInterval(async () => {
                const count = msgCounts.get(key) || 0;
                msgCounts.set(key, 0);

                const channel = await client.channels.fetch(channelId) as TextChannel;
                if (!channel || !channel.setRateLimitPerUser) return;

                if (count >= threshold && channel.rateLimitPerUser < 5) {
                    await channel.setRateLimitPerUser(5, 'Auto-slowmode: High traffic detected.');
                    await channel.send('⚠️ **High traffic detected.** Level 1 Slowmode (5s) enabled.');
                } else if (count >= threshold * 2 && channel.rateLimitPerUser < 15) {
                    await channel.setRateLimitPerUser(15, 'Auto-slowmode: Extreme traffic detected.');
                    await channel.send('🚨 **Extreme traffic detected.** Level 2 Slowmode (15s) enabled.');
                } else if (count < threshold / 2 && channel.rateLimitPerUser > 0) {
                    await channel.setRateLimitPerUser(0, 'Auto-slowmode: Traffic normalized.');
                    await channel.send('✅ **Traffic normalized.** Slowmode disabled.');
                }
            }, 10000);

            activeMonitors.set(key, interval);

            // Hook into messageCreate to count messages
            client.on('messageCreate', (msg) => {
                if (msg.channelId === channelId && !msg.author.bot) {
                    msgCounts.set(key, (msgCounts.get(key) || 0) + 1);
                }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Auto-Slowmode Enabled', `Monitoring traffic. Threshold: **${threshold}** msgs/10s.`)] });
        } else {
            const interval = activeMonitors.get(key);
            if (interval) {
                clearInterval(interval);
                activeMonitors.delete(key);

                const channel = await client.channels.fetch(channelId) as TextChannel;
                if (channel?.setRateLimitPerUser) await channel.setRateLimitPerUser(0, 'Auto-slowmode disabled.');

                return interaction.reply({ embeds: [EmbedUtils.success('Auto-Slowmode Disabled', 'Traffic monitoring stopped.')] });
            }
            return interaction.reply({ content: 'Auto-slowmode was not active.' });
        }
    },
} as Command;
