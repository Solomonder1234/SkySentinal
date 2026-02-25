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
     * Intercepts incoming DMs to the bot and routes them to a Modmail thread
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

        const modmailChannel = guild.channels.cache.get((config as any).modmailChannelId!) as TextChannel;
        if (!modmailChannel || !modmailChannel.isTextBased()) {
            await message.reply({ embeds: [EmbedUtils.error('Modmail Error', 'The target Modmail hub is currently unreachable. Please try again later.')] }).catch(() => { });
            return;
        }

        // Try to find an open thread for this user
        let targetThread = modmailChannel.threads.cache.find(t => t.name === `${message.author.username}-${message.author.id}`) as ThreadChannel;

        if (!targetThread) {
            // Find archived threads too
            try {
                const archived = await modmailChannel.threads.fetchArchived();
                targetThread = archived.threads.find(t => t.name === `${message.author.username}-${message.author.id}`) as ThreadChannel;

                if (targetThread) {
                    await targetThread.setArchived(false); // Unarchive
                    const userConfirmEmbed = new EmbedBuilder()
                        .setTitle('📩 Modmail Reopened')
                        .setDescription(`Your message has been received by the staff team at **${guild.name}**.\nWe will reach out as soon as possible.\n\n*Future messages sent here will be relayed directly to your support thread.*`)
                        .setColor(Colors.Green)
                        .setTimestamp();
                    await message.reply({ embeds: [userConfirmEmbed] }).catch(() => { });
                }
            } catch (err) {
                this.client.logger.warn(`Could not fetch archived threads: ${err}`);
            }

            if (!targetThread) {
                // Create a brand new thread
                targetThread = await modmailChannel.threads.create({
                    name: `${message.author.username}-${message.author.id}`,
                    type: ChannelType.PrivateThread, // Make it private for staff only
                    invitable: false,
                    reason: `Modmail thread created for ${message.author.tag}`
                });

                const startEmbed = new EmbedBuilder()
                    .setTitle('🔔 New Modmail Received')
                    .setDescription(`User: <@${message.author.id}> (\`${message.author.id}\`)\n\nPlease reply directly to this thread to talk to the user.`)
                    .setColor(Colors.Blue)
                    .setTimestamp();
                await targetThread.send({ embeds: [startEmbed] });

                const userConfirmEmbed = new EmbedBuilder()
                    .setTitle('📩 Modmail Open')
                    .setDescription(`Your message has been received by the staff team at **${guild.name}**.\nWe will reach out as soon as possible.\n\n*Future messages sent here will be relayed directly to your support thread.*`)
                    .setColor(Colors.Green)
                    .setTimestamp();
                await message.reply({ embeds: [userConfirmEmbed] }).catch(() => { });
            }
        }

        // Process message content and attachments
        const files = Array.from(message.attachments.values()).map(a => a.url);

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content || '[No Content]')
            .setColor(Colors.DarkGrey)
            .setTimestamp();

        try {
            await targetThread.send({ embeds: [dmEmbed], ...(files.length > 0 && { files }) });
            await message.react('✅').catch(() => { });
        } catch (e) {
            this.client.logger.error(`Failed to route DM to thread for ${message.author.tag}:`, e);
            await message.react('❌').catch(() => { });
        }
    }

    /**
     * Catches staff replies inside a Modmail Thread and forwards them to the user via DM.
     */
    public async handleStaffReply(message: Message) {
        if (message.author.bot) return;
        if (!message.channel.isThread()) return;

        this.client.logger.info(`[ModmailTrace] Caught Thread Message from ${message.author.tag} in ${message.channel.id}`);

        const thread = message.channel as ThreadChannel;
        // Check if thread is a Modmail thread (name format: "username-userid")
        const match = thread.name.match(/-(\d+)$/);
        if (!match || !match[1]) {
            this.client.logger.warn(`[ModmailTrace] Thread name ${thread.name} did not match regex`);
            return;
        }

        const userId = match[1];
        this.client.logger.info(`[ModmailTrace] Parsed UserId: ${userId}`);

        const config = JSONDatabase.getGuildConfig(message.guildId!);
        this.client.logger.info(`[ModmailTrace] Config fetched. Modmail Channel ID: ${(config as any).modmailChannelId}. Thread Parent ID: ${thread.parentId}`);

        if (!config || (config as any).modmailChannelId !== thread.parentId) {
            this.client.logger.warn(`[ModmailTrace] Thread parent mismatch or no config.`);
            return;
        }

        // Skip command invocation so staff can use bot commands inside the thread
        if (message.content.startsWith(config.prefix || '!')) {
            this.client.logger.info(`[ModmailTrace] Skipped due to prefix ${config.prefix || '!'}`);
            return;
        }

        const targetUser = await this.client.users.fetch(userId).catch(() => null);
        this.client.logger.info(`[ModmailTrace] Target user fetched: ${targetUser ? targetUser.tag : 'null'}`);
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
