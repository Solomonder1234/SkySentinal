import { TextChannel, EmbedBuilder, ChannelType, GuildMember, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
        const config = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: guild.id }
        });

        if (!config) return;

        // Hardcoded IDs provided by user (FALLBACKS)
        const FALLBACK_CATEGORY_ID = '1475582380864442581';
        const FALLBACK_UNVERIFIED_ROLE_ID = '1373474789653741649';

        // @ts-ignore
        const categoryId = config.onboardingChannelId || FALLBACK_CATEGORY_ID;
        // @ts-ignore
        const unverifiedRoleId = config.unverifiedRoleId || FALLBACK_UNVERIFIED_ROLE_ID;

        try {
            // Create the private channel
            const channel = await guild.channels.create({
                name: `onboard-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: categoryId,
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
            const questions = JSON.parse(config.onboardingQuestions || '[]');
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

        const config = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: message.guild.id }
        });

        if (!config) return;

        // @ts-ignore
        const questions = JSON.parse(config.onboardingQuestions || '[]');
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
    public async approve(moderator: GuildMember, target: GuildMember, channel: TextChannel) {
        const config = await this.client.database.prisma.guildConfig.findUnique({
            where: { id: moderator.guild.id }
        });

        if (!config || !config.unverifiedRoleId) return;

        try {
            // Remove unverified role
            // @ts-ignore
            await target.roles.remove(config.unverifiedRoleId);

            await channel.send({
                embeds: [EmbedUtils.success('Access Granted', `Welcome to the server, <@${target.id}>! You have been approved by <@${moderator.id}>.`)]
            });

            // Send specialized welcome message to General Chat (ID provided by user)
            const GENERAL_CHAT_ID = '1329128469166297159';
            try {
                const welcomeChannel = target.guild.channels.cache.get(GENERAL_CHAT_ID) as TextChannel;
                if (welcomeChannel && welcomeChannel.isTextBased()) {
                    await welcomeChannel.send({
                        content: `🎉 Everyone welcome our newest member, <@${target.id}>! They have just cleared onboarding and are now part of the community!`
                    });
                }
            } catch (e) { }

            // Delete channel after a delay
            setTimeout(() => channel.delete().catch(() => null), 5000);
        } catch (error) {
            this.client.logger.error(`Approve failed for ${target.user.tag}:`, error);
        }
    }
}
