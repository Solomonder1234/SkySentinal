import { AttachmentBuilder, TextChannel, EmbedBuilder, ThreadChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CategoryChannel, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AIService } from './AIService';
import { SkyClient } from '../structures/SkyClient';

// PR Questions
const PR_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "What time zone are you located in?",
    "Why do you want to join the Public Relations team here?",
    "What experience do you have with community engagement or PR roles?",
    "Scenario: How would you handle a user who is constantly complaining about the server in general chat?",
    "Describe a time you successfully de-escalated a tense situation.",
    "How would you welcome a new user who seems lost?",
    "A user asks a question you don't know the answer to. What do you do?",
    "What ideas do you have to improve server activity and engagement?",
    "Multiple Choice: If a member starts casually advertising their own server in general chat, do you: \nA) Warn them and delete the message \nB) Ban them immediately \nC) Ignore it \nD) DM them",
    "How much time can you dedicate to the PR team per week?",
    "Is there anything else you'd like us to know about you before we conclude?"
];

// Trial Staff Questions
const STAFF_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "What time zone are you located in?",
    "What previous moderation experience do you have?",
    "Why do you want to become a Trial Staff member?",
    "What do you consider to be the most important rule in our server?",
    "Scenario: Two users are arguing heatedly in a public channel. How do you intervene?",
    "Scenario: A user is spamming NSFW content in general. What are your immediate actions?",
    "Scenario: A high-ranking staff member is breaking a rule. How do you handle it?",
    "Multiple Choice: Which punishment is appropriate for a first-time minor offense (e.g., slight spam)? \nA) Ban \nB) Mute/Timeout \nC) Verbal Warning \nD) Kick",
    "How would you handle a user who is constantly trying to find loopholes in the rules to annoy others?",
    "Are you familiar with Discord's built-in moderation tools (Timeouts, Audit Logs, etc.)?",
    "What distinguishes a good moderator from a bad one?",
    "Scenario: A user DMs you accusing another staff member of abuse. What is your next step?",
    "How many hours a week can you dedicate to moderating the server?",
    "Is there anything else you'd like us to know about you before we conclude?"
];

// Support Team Questions
const SUPPORT_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "What time zone are you located in?",
    "Have you ever worked in a support or ticking environment before?",
    "Scenario: A user opens a ticket complaining that they were unfairly banned. How do you respond?",
    "Scenario: A user is extremely angry and using profanity in a ticket because a bot isn't working. How do you de-escalate?",
    "What steps would you take if a user asks for help with an issue you've never seen before?",
    "How many hours a week can you dedicate to answering tickets?"
];

// Social Media Team Questions
const MEDIA_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "Which social platforms are you most active on (Twitter, TikTok, Instagram)?",
    "Do you have previous experience managing social media accounts for a community or brand?",
    "What strategies would you use to increase engagement on a freshly posted tweet or video?",
    "How would you respond to negative comments or trolls on our official posts?",
    "Provide a brief example of a tweet announcing a new server update.",
    "How many hours a week can you dedicate to this role?"
];

// Content Creator Questions
const CREATOR_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "Please link your primary content platforms (YouTube, Twitch, TikTok, etc.).",
    "What type of content do you primarily create?",
    "How often do you upload or stream?",
    "Why do you want the Content Creator role in this server?",
    "How do you plan to involve or promote this community in your content?",
    "Do you agree to adhere to our community guidelines while representing the server?"
];

// YouTube Broadcast Team
const YOUTUBE_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "Do you have experience moderating YouTube live chats or managing streams?",
    "Scenario: The live chat is being spammed with scam links. What are your immediate actions?",
    "How do you handle users who are constantly circumventing Nightbot filters?",
    "Are you familiar with YouTube Studio's moderation tools?",
    "How many hours a week can you dedicate to moderating live broadcasts?"
];

// Weather Team Questions
const WEATHER_QUESTIONS = [
    "What is your Discord Tag and Age?",
    "What is your current level of meteorological knowledge? (Hobbyist, Student, Professional)",
    "Describe what a CAPE value indicates and why it's important for severe weather.",
    "Scenario: A Tornado Warning is issued for a major city. Walk me through your process of analyzing the radar and posting an alert.",
    "What weather models do you primarily use for forecasting, and why?",
    "How do you distinguish between reliable weather data and sensationalized hype on social media?",
    "How many hours a week can you dedicate to monitoring weather events?"
];

export class ApplicationService {
    private client: SkyClient;

    constructor(client: SkyClient) {
        this.client = client;
        this.startReviewCleanup();
        this.startSuspensionCleanup();
    }

    private getQuestionsForType(type: string): string[] {
        switch (type) {
            case 'PR': return PR_QUESTIONS;
            case 'TRIAL_STAFF': return STAFF_QUESTIONS;
            case 'SUPPORT': return SUPPORT_QUESTIONS;
            case 'SOCIAL_MEDIA': return MEDIA_QUESTIONS;
            case 'CONTENT_CREATOR': return CREATOR_QUESTIONS;
            case 'YOUTUBE_BROADCAST': return YOUTUBE_QUESTIONS;
            case 'WEATHER_TEAM': return WEATHER_QUESTIONS;
            default: return STAFF_QUESTIONS;
        }
    }

    private getPrettyNameForType(type: string): string {
        switch (type) {
            case 'PR': return 'Public Relations';
            case 'TRIAL_STAFF': return 'Trial Staff';
            case 'SUPPORT': return 'Support Team';
            case 'SOCIAL_MEDIA': return 'Social Media Team';
            case 'CONTENT_CREATOR': return 'Content Creator';
            case 'YOUTUBE_BROADCAST': return 'YouTube Broadcast Team';
            case 'WEATHER_TEAM': return 'Weather Team';
            default: return 'Staff';
        }
    }

    public async startApplication(guild: any, user: any, type: string) {
        const guildId = guild.id;
        const userId = user.id;

        // --- Application Settings & Limits Check ---
        const settings = await this.client.database.prisma.applicationSettings.findUnique({
            where: { guildId }
        });

        if (!settings || !settings.isOpen) {
            return { success: false, message: 'Applications are currently closed.' };
        }

        // Increment application count
        await this.client.database.prisma.applicationSettings.update({
            where: { guildId },
            data: { applicationCount: { increment: 1 } }
        });

        // Check if user already has an active application
        const existingApp = await this.client.database.prisma.application.findFirst({
            where: { guildId, userId, status: 'IN_PROGRESS' }
        });

        if (existingApp) {
            return { success: false, message: 'You already have an application in progress.' };
        }

        try {
            // Find or create category for applications
            let category = guild.channels.cache.find((c: any) => c.name.toLowerCase() === 'active applications' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'Active Applications',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['ViewChannel'] },
                        { id: this.client.user?.id, allow: ['ViewChannel', 'ManageChannels'] }
                    ]
                });
            }

            // Create private channel
            const channelName = `app-${user.username.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}-${type.toLowerCase().substring(0, 10)}`;
            const appChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    { id: this.client.user?.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                ]
            });

            // Save to DB
            const appRecord = await this.client.database.prisma.application.create({
                data: {
                    guildId,
                    userId,
                    channelId: appChannel.id,
                    type,
                    status: 'IN_PROGRESS',
                    currentQuestion: -1, // Wait for button
                    answers: JSON.stringify([])
                }
            });

            // Ask first question
            const questions = this.getQuestionsForType(type);
            const prettyName = this.getPrettyNameForType(type);

            const welcomeEmbed = EmbedUtils.info(
                `${prettyName} Application`,
                `Welcome <@${user.id}>! You are applying for **${prettyName}**.\n\nThere are **${questions.length}** questions in total.\n**⚠️ CRITICAL INSTRUCTION:** Your answers MUST be in **complete sentences** and strictly **1-2 sentences** per response.\n\n**⏳ TIME LIMIT**: You have **30 minutes** to complete this application before the channel automatically closes due to inactivity.\n\n**🛑 MANDATORY 2FA CHECKPOINT 🛑**\nBefore we begin, you **MUST** have Two-Factor Authentication (2FA) enabled on your Discord account to hold any staff or sub-team position. By proceeding, you confirm that 2FA is active. If you lie, your application will be instantly denied and you may be blacklisted.\n\nDo you currently have 2FA enabled?`
            );

            const startBtnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('app_2fa_yes').setLabel('Yes, I have 2FA Enabled').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
                new ButtonBuilder().setCustomId('app_2fa_no').setLabel('No / Cancel').setStyle(ButtonStyle.Danger)
            );

            await appChannel.send({
                content: `<@${user.id}>`,
                embeds: [welcomeEmbed],
                components: [startBtnRow as any]
            });

            // Start 30-minute unseen timer
            setTimeout(async () => {
                const checkApp = await this.client.database.prisma.application.findUnique({ where: { id: appRecord.id } });
                if (checkApp && checkApp.status === 'IN_PROGRESS') {
                    await this.client.database.prisma.application.update({
                        where: { id: appRecord.id },
                        data: { status: 'COMPLETED' }
                    });

                    try {
                        const applicantUser = await this.client.users.fetch(checkApp.userId);
                        await applicantUser.send({
                            embeds: [EmbedUtils.error('Application Denied', 'Your application was automatically closed due to inactivity. You did not complete the interview within the 30-minute time limit.')]
                        }).catch(() => null);
                    } catch (e) { }

                    try {
                        const ch = await this.client.channels.fetch(checkApp.channelId);
                        if (ch && ch.isTextBased()) await ch.delete();
                    } catch (e) { }
                }
            }, 30 * 60 * 1000); // 30 minutes

            return { success: true, channelId: appChannel.id };
        } catch (error) {
            this.client.logger.error('Failed to start application:', error);
            return { success: false, message: 'An error occurred while creating your application channel.' };
        }
    }

    public async handleMessage(message: Message) {
        if (message.author.bot || !message.guild) return;

        // Check if the channel is an application channel
        const appRecord = await this.client.database.prisma.application.findUnique({
            where: { channelId: message.channel.id }
        });

        if (!appRecord || appRecord.status !== 'IN_PROGRESS' || appRecord.userId !== message.author.id) {
            return;
        }

        // The user hasn't clicked start yet, or just clicked start (currentQuestion happens after button click)
        if (appRecord.currentQuestion < 0) return; // Wait for button

        const questions = this.getQuestionsForType(appRecord.type);
        const qIndex = appRecord.currentQuestion;

        if (qIndex >= questions.length) return; // Should be completed

        // Save answer
        const answers = JSON.parse(appRecord.answers);
        answers.push({
            question: questions[qIndex],
            answer: message.content
        });

        const nextQIndex = qIndex + 1;

        if (nextQIndex >= questions.length) {
            // Completed
            await this.client.database.prisma.application.update({
                where: { id: appRecord.id },
                data: { status: 'COMPLETED', answers: JSON.stringify(answers) }
            });

            await (message.channel as TextChannel).send({
                embeds: [EmbedUtils.success('Application Completed', 'Thank you for your time. Your transcript is now being compiled and sent to the AI Recruiter for processing and grading. This channel will close shortly.')]
            });

            // Trigger AI Grading
            this.gradeApplication(appRecord.id, message.guild).catch(e => this.client.logger.error('Grading error', e));

            setTimeout(async () => {
                try { await message.channel.delete(); } catch (e) { }
            }, 10000);

        } else {
            // Next question
            await this.client.database.prisma.application.update({
                where: { id: appRecord.id },
                data: { currentQuestion: nextQIndex, answers: JSON.stringify(answers) }
            });

            await (message.channel as TextChannel).send({
                embeds: [EmbedUtils.info(`Question ${nextQIndex + 1} of ${questions.length}`, questions[nextQIndex] as string)]
            });
        }
    }

    public async sendNextQuestion(channelId: string) {
        let appRecord = await this.client.database.prisma.application.findUnique({
            where: { channelId }
        });
        if (!appRecord || appRecord.status !== 'IN_PROGRESS') return;

        if (appRecord.currentQuestion < 0) {
            appRecord = await this.client.database.prisma.application.update({
                where: { id: appRecord.id },
                data: { currentQuestion: 0 }
            });
        }

        const channel = await this.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) return;

        const questions = this.getQuestionsForType(appRecord.type);
        await (channel as TextChannel).send({
            embeds: [EmbedUtils.info(`Question ${appRecord.currentQuestion + 1} of ${questions.length}`, questions[appRecord.currentQuestion] as string)]
        });
    }

    private async gradeApplication(appId: number, guild: any) {
        const appRecord = await this.client.database.prisma.application.findUnique({ where: { id: appId } });
        if (!appRecord) return;

        const answers = JSON.parse(appRecord.answers);
        let transcriptStr = `### ${appRecord.type} Application Transcript\n\n`;

        answers.forEach((qObj: any, idx: number) => {
            transcriptStr += `**Q${idx + 1}: ${qObj.question}**\n> ${qObj.answer}\n\n`;
        });


        const prompt = `
You are the SkyAlertBot AI Lead Recruiter. Review the following ${appRecord.type} application transcript.

STRICT INSTRUCTIONS:
1. Evaluate the applicant on professionalism, scenario handling, maturity, and alignment with Discord Server Staff Guidelines. 
2. MOBILE USER LENIENCY: You MUST be extremely forgiving of minor typos, grammar inconsistencies, or casing issues. Many applicants are on mobile devices where "upper classes" or lack of punctuation is common. Focus strictly on the core content and maturity of their answers.
3. AI DETECTION: You MUST analyze the transcript for signs of AI-generated responses (e.g., overly perfect, robotic, academic structure). Only fail for AI if you are 100% certain. Human-like errors are a sign they ARE human.
4. GRADING SCALE: Assign a percentage score out of 100%. To PASS, the applicant MUST score 75% or higher.
5. FORMAT: Your ENTIRE response MUST be EXACTLY 1-2 complete sentences explaining your recommendation, followed by the score and [PASS] or [FAIL]. Do NOT use any special formatting. Just raw text.
6. 2FA REQUIREMENT: The applicant has explicitly confirmed they have 2FA enabled as a prerequisite for this interview.

${transcriptStr}
`;

        // Send to AI Service
        const aiService = this.client.ai;
        let gradingResult = "AI Grading Failed.";

        if (aiService) {
            try {
                const response = await aiService.generateResponse(prompt);
                gradingResult = response.text;
            } catch (err) {
                this.client.logger.error('AI Processing error:', err);
                gradingResult = "Error reaching AI core.";
            }
        }

        // Update DB to PENDING_REVIEW and store AI's proposal
        await this.client.database.prisma.application.update({
            where: { id: appId },
            data: {
                status: 'PENDING_REVIEW',
                submittedAt: new Date(),
                aiProposedResult: gradingResult
            }
        });

        // Delete the private interview channel
        try {
            const channel = await guild.channels.fetch(appRecord.channelId);
            if (channel) await channel.delete().catch(() => null);
        } catch (e) { }

        // Post to staff review channel
        const staffChannelId = '1381685965063721031';
        try {
            const staffChannel = await guild.channels.fetch(staffChannelId);
            if (staffChannel && staffChannel.isTextBased()) {
                const passed = gradingResult.includes('[PASS]');

                const resultEmbed = new EmbedBuilder()
                    .setTitle(`Review Required: ${appRecord.type} Application`)
                    .setDescription(`**Applicant:** <@${appRecord.userId}>\n**AI Recommendation:** ${gradingResult}\n\n**Note:** This is an AI-assisted recommendation. A Co-founder+ must manually review the transcript and decide. If no action is taken within 48 hours, the AI decision will be executed automatically.`)
                    .setColor(passed ? '#00ff00' : '#ffaa00')
                    .setTimestamp();

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`staff_app_approve_${appRecord.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`staff_app_deny_${appRecord.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId(`staff_app_view_${appRecord.id}`).setLabel('View Transcript').setStyle(ButtonStyle.Secondary)
                );

                await staffChannel.send({ content: '<@&1275838079718002829> <@&1282527079828815944>', embeds: [resultEmbed], components: [row as any] });
            }
        } catch (err) {
            this.client.logger.error('Failed to log graded app:', err);
        }
    }


    private getRoleAndPrefixForType(type: string): { role: string, prefix: string } {
        switch (type) {
            case 'PR': return { role: 'public relations', prefix: '[PR]' };
            case 'TRIAL_STAFF': return { role: 'trial staff', prefix: '[TS]' };
            case 'SUPPORT': return { role: 'support team', prefix: '[SUP]' };
            case 'SOCIAL_MEDIA': return { role: 'social media team', prefix: '[SMT]' };
            case 'CONTENT_CREATOR': return { role: 'content creator', prefix: '[CC]' };
            case 'YOUTUBE_BROADCAST': return { role: 'youtube broadcast team', prefix: '[YT]' };
            case 'WEATHER_TEAM': return { role: 'weather team', prefix: '[WX]' };
            default: return { role: 'staff', prefix: '[STAFF]' };
        }
    }

    public async processStaffDecision(appId: number, staffId: string, decision: 'ACCEPTED' | 'DENIED', guild: any, isAuto: boolean = false) {
        const app = await this.client.database.prisma.application.findUnique({ where: { id: appId } });
        if (!app || app.status !== 'PENDING_REVIEW') return { success: false, message: 'Application not found or already processed.' };

        await this.client.database.prisma.application.update({
            where: { id: appId },
            data: {
                status: decision,
                reviewedBy: isAuto ? 'SYSTEM_AUTO' : staffId
            }
        });

        const passed = decision === 'ACCEPTED';
        const gradingResult = app.aiProposedResult || "No AI feedback available.";

        // DM the Applicant
        try {
            const applicantUser = await this.client.users.fetch(app.userId).catch(() => null);
            if (applicantUser) {
                const statusTitle = passed ? 'Application Accepted' : 'Application Denied';
                const statusColor = passed ? '#00ff00' : '#ff0000';

                const dmEmbed = new EmbedBuilder()
                    .setTitle(`SkyAlert Network: ${statusTitle}`)
                    .setDescription(`Your application for **${app.type}** has been processed by our ${isAuto ? 'AI fallback system' : 'staff team'}.\n\n**Decision Analysis:**\n${gradingResult.substring(0, 3900)}\n\n${passed ? 'Congratulations, you have Passed! You have been promoted. An administrator will contact you shortly.' : 'Unfortunately, you do not meet our requirements at this time.'}`)
                    .setColor(statusColor);

                await applicantUser.send({ embeds: [dmEmbed] }).catch(() => null);
            }
        } catch (err) { }

        // Auto-Promote
        if (passed) {
            try {
                const { role: targetRoleName, prefix } = this.getRoleAndPrefixForType(app.type);
                let targetRole = guild.roles.cache.find((r: any) => r.name.toLowerCase() === targetRoleName);

                if (!targetRole && app.type === 'PR') {
                    targetRole = guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'trial staff');
                }

                if (targetRole) {
                    const applicantMember = await guild.members.fetch(app.userId).catch(() => null);
                    if (applicantMember) {
                        await applicantMember.roles.add(targetRole.id);

                        const currentName = applicantMember.displayName;
                        if (!currentName.startsWith(prefix)) {
                            const newName = `${prefix} ${currentName.replace(/^\[.*?\]\s*/, '')}`;
                            await applicantMember.setNickname(newName.substring(0, 32)).catch(() => null);
                        }
                    }
                }
            } catch (err) { }
        }

        return { success: true, passed };
    }

    public async getTranscriptFile(appId: number) {
        const app = await this.client.database.prisma.application.findUnique({ where: { id: appId } });
        if (!app) return null;

        const answers = JSON.parse(app.answers);
        let text = `SKYALERT NETWORK APPLICATION TRANSCRIPT\n`;
        text += `Applicant: ${app.userId}\nType: ${app.type}\nSubmitted: ${app.submittedAt}\n\n`;

        answers.forEach((q: any, i: number) => {
            text += `Q${i + 1}: ${q.question}\n`;
            text += `A: ${q.answer}\n\n`;
        });

        return new AttachmentBuilder(Buffer.from(text), { name: `transcript-${app.userId}.txt` });
    }

    public startReviewCleanup() {
        setInterval(async () => {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const pendingApps = await this.client.database.prisma.application.findMany({
                where: {
                    status: 'PENDING_REVIEW',
                    submittedAt: { lt: fortyEightHoursAgo }
                }
            });

            for (const app of pendingApps) {
                const guild = this.client.guilds.cache.get(app.guildId);
                if (!guild) continue;

                const pass = app.aiProposedResult?.includes('[PASS]');
                await this.processStaffDecision(app.id, 'SYSTEM_AUTO', pass ? 'ACCEPTED' : 'DENIED', guild, true);
                this.client.logger.info(`AI Fallback executed for app ${app.id} (${app.userId})`);
            }
        }, 60 * 60 * 1000); // Check every hour
    }

    public startSuspensionCleanup() {
        setInterval(async () => {
            try {
                const now = new Date();
                const expiredSuspensions = await this.client.database.prisma.suspension.findMany({
                    where: {
                        active: true,
                        expiresAt: { lte: now }
                    }
                });

                for (const suspension of expiredSuspensions) {
                    const guild = this.client.guilds.cache.get(suspension.guildId);
                    if (!guild) continue;

                    try {
                        const targetMember = await guild.members.fetch(suspension.userId);
                        const suspendRoleId = '1373474789653741649';

                        // Restore Roles
                        const rolesToRestore = JSON.parse(suspension.roles);
                        if (rolesToRestore && rolesToRestore.length > 0) {
                            const validRoles = rolesToRestore.filter((id: string) => guild.roles.cache.has(id));
                            if (validRoles.length > 0) {
                                await targetMember.roles.add(validRoles);
                            }
                        }

                        // Remove Suspended Role
                        await targetMember.roles.remove(suspendRoleId);

                        // Restore Nickname
                        const currentName = targetMember.displayName;
                        if (currentName.includes('[S]')) {
                            await targetMember.setNickname(suspension.originalName.substring(0, 32));
                        }

                        // Mark inactive
                        await this.client.database.prisma.suspension.update({
                            where: { id: suspension.id },
                            data: { active: false }
                        });

                        this.client.logger.info(`Automatically unsuspended user ${suspension.userId} from expired 7-day suspension.`);

                        // Notify user
                        try {
                            const dmEmbed = EmbedUtils.success(
                                'Staff Suspension Expired',
                                `Your 1-week suspension in **${guild.name}** has automatically expired.\n\nYour original roles and prefix have been restored. Welcome back.`
                            );
                            await targetMember.send({ embeds: [dmEmbed] });
                        } catch (e) {
                            // Ignore DM error
                        }

                    } catch (e) {
                        this.client.logger.error(`Failed to automatically unsuspend user ${suspension.userId}:`, e);
                    }
                }
            } catch (error) {
                this.client.logger.error('Error in suspension cleanup loop:', error);
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

}