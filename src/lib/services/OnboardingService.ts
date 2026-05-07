import { TextChannel, EmbedBuilder, ChannelType, GuildMember, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { SkyClient } from '../structures/SkyClient';

export class OnboardingService {
    private client: SkyClient;

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Triggered when a member joins. Creates their private onboarding channel.
     */
    public async handleMemberJoin(member: GuildMember) {
        const guild = member.guild;
        let config: any = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: guild.id }
        });

        if (!config) {
            config = {} as any;
            this.client.logger.warn(`No guildConfig found for ${guild.id}, using hardcoded fallbacks for onboarding!`);
        }

        // Hardcoded IDs provided by user (FALLBACKS)
        const FALLBACK_CATEGORY_ID = '1475582320718118963';
        const FALLBACK_UNVERIFIED_ROLE_ID = '1371788188087226428';

        // @ts-ignore
        const categoryId = config.onboardingChannelId || FALLBACK_CATEGORY_ID;
        // @ts-ignore
        const unverifiedRoleId = config.unverifiedRoleId || FALLBACK_UNVERIFIED_ROLE_ID;

        try {
            // Attempt to DM the user instructions before proceeding with the rest of the onboarding
            try {
                await member.send({
                    content: `👋 **Welcome to ${guild.name}!**`,
                    embeds: [
                        EmbedUtils.info(
                            'How to gain access to the server',
                            'Currently, your access is restricted. To unlock the rest of the server, please navigate to the **rules** and **onboarding** channels.\n\nOnce you complete the required steps, you will be granted the Member role and given full access!'
                        )
                    ]
                });
            } catch (dmError) {
                this.client.logger.warn(`Could not send DM to ${member.user.tag} (DMs might be closed).`);
            }

            // Validate or Reconstruct Category to prevent CHANNEL_PARENT_INVALID crash
            let validCategoryId = categoryId;
            const existingCategory = guild.channels.cache.get(categoryId);
            if (!existingCategory || existingCategory.type !== ChannelType.GuildCategory) {
                const newCategory = await guild.channels.create({
                    name: 'ONBOARDING AIRLOCK',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }
                    ]
                });
                validCategoryId = newCategory.id;
            }

            // Create the private channel
            const channel = await guild.channels.create({
                name: `onboard-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: validCategoryId,
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    { id: this.client.user!.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                ]
            });

            // Assign unverified role
            await member.roles.add(unverifiedRoleId).catch(() => null);

            // Send greeting
            const embed = EmbedUtils.info(
                'Welcome to ' + guild.name,
                // @ts-ignore
                config.onboardingGreeting || 'Welcome! Please answer the following questions to gain access to the server.'
            );

            // @ts-ignore
            let questions = JSON.parse(config.onboardingQuestions || '[]');
            if (questions.length === 0) {
                questions = [
                    "How did you discover the SkyAlert Network?",
                    "What is your primary relationship with or interest in Meteorology?",
                    "Have you read, understood, and agreed to follow the server's official rules?"
                ];
            }
            if (questions.length > 0) {
                embed.addFields({ name: 'Next Step', value: `Please answer our onboarding questions. \n\n**Question 1:** ${questions[0]}` });
            } else {
                embed.addFields({ name: 'Next Step', value: 'Please wait for a staff member to approve your access with `!approve`.' });
            }

            await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

            // Store current question state in a simple map or just rely on message count
            // For now, let's use a very simple approach: check the last few messages
        } catch (error) {
            this.client.logger.error(`Failed to initiate onboarding for ${member.user.tag}:`, error);
        }
    }

    /**
     * Handles answering questions in the onboarding channel.
     */
    public async handleMessage(message: Message) {
        if (message.author.bot || !message.guild || !message.channel.isTextBased()) return;
        if (!(message.channel as TextChannel).name.startsWith('onboard-')) return;

        let config: any = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: message.guild.id }
        });

        if (!config) config = {} as any;

        // Ignore messages starting with the prefix (they are commands)
        const prefix = config.prefix || '!';
        if (message.content.startsWith(prefix)) return;

        // @ts-ignore
        let questions = JSON.parse(config.onboardingQuestions || '[]');
        if (questions.length === 0) {
            questions = [
                "How did you discover the SkyAlert Network?",
                "What is your primary relationship with or interest in Meteorology?",
                "Have you read, understood, and agreed to follow the server's official rules?"
            ];
        }
        if (questions.length === 0) return;

        // Count non-bot messages to determine the current question
        const messages = await message.channel.messages.fetch({ limit: 50 });
        const userMessages = messages.filter(m => !m.author.bot);
        const currentIndex = userMessages.size - 1;

        if (currentIndex < questions.length - 1) {
            const nextQuestion = questions[currentIndex + 1];
            await message.reply({
                embeds: [EmbedUtils.info(`Question ${currentIndex + 2} of ${questions.length}`, nextQuestion)]
            });
        } else if (currentIndex === questions.length - 1) {
            await message.reply({
                embeds: [EmbedUtils.success('Onboarding Complete', 'Thank you! Your answers have been recorded. Please wait for a staff member to review and use `!approve` to let you in.')]
            });

            // Log to mod channel that onboarding is complete
            if (config.modLogChannelId) {
                const modChannel = message.guild.channels.cache.get(config.modLogChannelId) as TextChannel;
                if (modChannel) {
                    const notifyEmbed = EmbedUtils.info(
                        'Onboarding Complete',
                        `User <@${message.author.id}> has finished the onboarding interview in <#${message.channel.id}>.`
                    );
                    await modChannel.send({ embeds: [notifyEmbed] });
                }
            }
        }
    }

    /**
     * Finalizes onboarding by granting roles and cleaning up.
     */
    public async approve(moderator: GuildMember, target: GuildMember, channel?: TextChannel) {
        let config: any = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: moderator.guild.id }
        });

        if (!config) config = {} as any;

        // Hardcoded IDs provided by user (FALLBACKS)
        const FALLBACK_UNVERIFIED_ROLE_ID = '1371788188087226428';
        const FALLBACK_MEMBER_ROLE_ID = '1370396828490666135';

        // @ts-ignore
        const unverifiedRoleId = config.unverifiedRoleId || FALLBACK_UNVERIFIED_ROLE_ID;

        // Check if user already has member role (prevents duplication)
        if (target.roles.cache.has(FALLBACK_MEMBER_ROLE_ID)) {
            this.client.logger.info(`[Approve] ${target.user.username} already verified, skipping duplicates.`);
            return;
        }

        try {
            // Remove unverified role
            await target.roles.remove(unverifiedRoleId).catch(() => null);

            // Add member role
            await target.roles.add(FALLBACK_MEMBER_ROLE_ID).catch(() => null);

            if (channel) {
                await channel.send({
                    embeds: [EmbedUtils.success('Access Granted', `Welcome to the server, <@${target.id}>! You have been approved by <@${moderator.id}>.`)]
                });
            }

            // Send specialized welcome message to General Chat (ID provided by user)
            const GENERAL_CHAT_ID = '1329128469166297159';
            try {
                const welcomeChannel = target.guild.channels.cache.get(GENERAL_CHAT_ID) as TextChannel;
                if (welcomeChannel && welcomeChannel.isTextBased()) {

                    // --- STATIC GRAPHIC GENERATION ---
                    const canvas = createCanvas(800, 400);
                    const ctx = canvas.getContext('2d');

                    const grad = ctx.createLinearGradient(0, 0, 800, 400);
                    grad.addColorStop(0, '#1c1c1f');
                    grad.addColorStop(1, '#0a0a0b');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, 800, 400);

                    const avatarURL = target.user.displayAvatarURL({ extension: 'png', size: 256 })
                        || 'https://cdn.discordapp.com/embed/avatars/0.png';
                    const avatarImg = await loadImage(avatarURL);

                    const avatarRadius = 100;
                    const avatarX = 800 / 2;
                    const avatarY = 160;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

                    ctx.lineWidth = 6;
                    ctx.strokeStyle = '#2ecc71';
                    ctx.stroke();
                    ctx.restore();

                    ctx.font = 'bold 42px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.fillText('WELCOME TO THE SERVER', 400, 320);

                    ctx.font = 'bold 36px sans-serif';
                    ctx.fillStyle = '#9aa0a6';
                    ctx.fillText(`@${target.user.username.toUpperCase()}`, 400, 365);

                    const buffer = Buffer.from(await canvas.encode('png'));
                    const attachment = new AttachmentBuilder(buffer, { name: 'welcome-image.png' });

                    await welcomeChannel.send({
                        content: `🎉 Everyone welcome our newest member, <@${target.id}>! They have just cleared onboarding and are now part of the community!`,
                        files: [attachment]
                    });
                }
            } catch (e) {
                this.client.logger.error(`Canvas Graphic Generation failed for ${target.user.username}: `, e);
            }

            // Delete channel after a delay if it's an onboarding channel
            if (channel && channel.name.startsWith('onboard-')) {
                setTimeout(() => channel.delete().catch(() => null), 5000);
            }
        } catch (error) {
            this.client.logger.error(`Approve failed for ${target.user.tag}:`, error);
        }
    }
}
