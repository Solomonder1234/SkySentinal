import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CategoryChannel, ChannelType, Colors, EmbedBuilder, Guild, Message, TextChannel, ThreadAutoArchiveDuration, ThreadChannel } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export class ModmailService {
    private client: SkyClient;

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Intercepts incoming DMs to the bot and routes them to a dedicated Modmail channel
     */
    public async handleDM(message: Message) {
        if (message.author.bot) return;

        const allConfigs = JSONDatabase.getAllConfigs();
        const configs = allConfigs.filter((c: any) => c.modmailChannelId != null);

        if (configs.length === 0) {
            await message.reply({ embeds: [EmbedUtils.error('Modmail Unavailable', 'Modmail is currently not configured for any servers.')] }).catch(() => { });
            return;
        }

        // For simplicity, we just pick the primary SkyAlert Network guild if multiple exist, or the first one.
        const primaryGuildId = '1197960305822965790';
        let config = configs.find((c: any) => c.id === primaryGuildId) || configs[0];

        const guild = this.client.guilds.cache.get(config.id);
        if (!guild) return;

        if (JSONDatabase.isModmailBlocked(config.id, message.author.id)) {
            await message.react('❌').catch(() => { });
            return;
        }

        // Create category if it doesn't exist
        let modmailCategory = guild.channels.cache.find(c => c.name === 'Modmail' && c.type === ChannelType.GuildCategory) as CategoryChannel;
        if (!modmailCategory) {
            const overwrites: any[] = [
                { id: guild.id, deny: ['ViewChannel'] },
                { id: this.client.user!.id, allow: ['ViewChannel', 'ManageChannels', 'SendMessages'] }
            ];

            if (config.modRoleId) {
                overwrites.push({ id: config.modRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            }
            if (config.adminRoleId) {
                overwrites.push({ id: config.adminRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            }

            modmailCategory = await guild.channels.create({
                name: 'Modmail',
                type: ChannelType.GuildCategory,
                permissionOverwrites: overwrites
            });
        }

        // Try to find an open channel for this user
        const targetChannelName = `mm-${message.author.id}`;
        let targetChannel = guild.channels.cache.find(c => c.name === targetChannelName && c.parentId === modmailCategory.id) as TextChannel;

        if (!targetChannel) {
            const overwrites: any[] = [
                { id: guild.id, deny: ['ViewChannel'] },
                { id: this.client.user!.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
            ];

            if (config.modRoleId) {
                overwrites.push({ id: config.modRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            }
            if (config.adminRoleId) {
                overwrites.push({ id: config.adminRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            }

            // Create a brand new channel
            targetChannel = await guild.channels.create({
                name: targetChannelName,
                type: ChannelType.GuildText,
                topic: `Modmail for ${message.author.tag} (${message.author.id})`,
                parent: modmailCategory.id,
                permissionOverwrites: overwrites
            });

            const startEmbed = new EmbedBuilder()
                .setTitle('🔔 New Modmail Received')
                .setDescription(`**User:** <@${message.author.id}> (\`${message.author.id}\`)\n\nStaff may reply directly in this channel to relay messages back to the user.`)
                .setColor('#ffaa00')
                .setTimestamp();
            await targetChannel.send({ embeds: [startEmbed] });

            const userConfirmEmbed = new EmbedBuilder()
                .setTitle('📩 Modmail Open')
                .setDescription(`Your message has been received by the staff team at **${guild.name}**.\nWe will reach out as soon as possible.\n\n*Future messages sent here will be relayed directly to your support channel.*`)
                .setColor(Colors.Green)
                .setTimestamp();
            await message.reply({ embeds: [userConfirmEmbed] }).catch(() => { });
        }

        // Process message content and attachments
        const files = Array.from(message.attachments.values()).map(a => a.url);

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content || '[No Content]')
            .setColor(Colors.DarkGrey)
            .setTimestamp();

        try {
            await targetChannel.send({ embeds: [dmEmbed], ...(files.length > 0 && { files }) });
            await message.react('✅').catch(() => { });
        } catch (e) {
            this.client.logger.error(`Failed to route DM to channel for ${message.author.tag}:`, e);
            await message.react('❌').catch(() => { });
        }
    }

    /**
     * Catches staff replies inside a Modmail Channel and forwards them to the user via DM.
     */
    public async handleStaffReply(message: Message) {
        if (message.author.bot) return;
        if (message.channel.type !== ChannelType.GuildText && !message.channel.isThread()) return;

        const channel = message.channel as TextChannel;

        // Check if channel is a Modmail channel (name format: "mm-userid")
        const match = channel.name.match(/^mm-(\d+)$/);
        if (!match || !match[1]) {
            return;
        }

        const userId = match[1];

        const config = JSONDatabase.getGuildConfig(message.guildId!);
        if (!config) return;

        // Skip command invocation so staff can use bot commands inside the channel
        if (message.content.startsWith(config.prefix || '!')) {
            return;
        }

        const targetUser = await this.client.users.fetch(userId).catch(() => null);
        if (!targetUser) {
            await message.reply({ embeds: [EmbedUtils.error('Error', 'Could not locate the user to forward this message. They may have left the server or been deleted.')] });
            return;
        }

        const replyEmbed = new EmbedBuilder()
            .setTitle('Staff Reply 📨')
            .setDescription(message.content || '[No Content]')
            .setColor(Colors.Green)
            .setFooter({ text: `Message from Staff` }) // Hidden staff tag for privacy
            .setTimestamp();

        const guildIcon = message.guild!.iconURL();
        if (guildIcon) {
            replyEmbed.setAuthor({ name: message.guild!.name, iconURL: guildIcon });
        } else {
            replyEmbed.setAuthor({ name: message.guild!.name });
        }

        const files = Array.from(message.attachments.values()).map(a => a.url);

        try {
            await targetUser.send({ embeds: [replyEmbed], ...(files.length > 0 && { files }) });
            await message.react('✅').catch(() => { });
            await message.reply({ content: '✅ *Message securely relayed to the user.*' }).catch(() => { });
        } catch (e) {
            await message.reply({ embeds: [EmbedUtils.error('Delivery Failed', 'The user has DMs disabled or blocked the bot.')] });
        }
    }
}
