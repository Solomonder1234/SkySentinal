import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { Logger } from '../../utils/Logger';
import { Database } from '../database/Database';
import { CommandHandler } from '../handlers/CommandHandler';
import { EventHandler } from '../handlers/EventHandler';
import { Command } from './Command';
import { EconomyService } from '../services/EconomyService';
import { AIService } from '../services/AIService';
import { ApplicationService } from '../services/ApplicationService';
import { TerminalService } from '../services/TerminalService';
import { MusicService } from '../services/MusicService';
import { OnboardingService } from '../services/OnboardingService';
import { SuggestionService } from '../services/SuggestionService';
import { BumpService } from '../services/BumpService';
import { PromotionService } from '../services/PromotionService';
import { ModmailService } from '../services/ModmailService';
import { StaffActivityEnforcer } from '../services/StaffActivityEnforcer';
import { GiveawayService } from '../services/GiveawayService';
import { WeatherAlertService } from '../services/WeatherAlertService';
import { StaffComplianceService } from '../services/StaffComplianceService';
import { ReminderService } from '../services/ReminderService';
import { AntinukeService } from '../services/AntinukeService';
import { CaptchaService } from '../services/CaptchaService';
import * as fs from 'fs';
import * as path from 'path';

export class SkyClient extends Client {
    public logger: Logger;
    public database: Database;
    public economy: EconomyService;
    public applicationService: ApplicationService;
    public music: MusicService;
    public ai?: AIService;
    public commands: Collection<string, Command>;
    public commandHandler: CommandHandler;
    public eventHandler: EventHandler;
    public terminal: TerminalService;
    public onboarding: OnboardingService;
    public suggestions: SuggestionService;
    public bump: BumpService;
    public promotions: PromotionService;
    public modmail: ModmailService;
    public activityEnforcer: StaffActivityEnforcer;
    public giveaways: GiveawayService;
    public weatherAlerts: WeatherAlertService;
    public staffCompliance: StaffComplianceService;
    public reminders: ReminderService;
    public antinuke: AntinukeService;
    public captcha: CaptchaService;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
        });

        this.logger = new Logger();
        this.database = new Database();
        this.economy = new EconomyService(this.database.prisma);

        if (process.env.GEMINI_API_KEY) {
            this.ai = new AIService(process.env.GEMINI_API_KEY, process.env.OPENAI_API_KEY, process.env.WEATHER_API_KEY);
            this.logger.info('AI Service initialized with Gemini, OpenAI fallback, and Real-time Weather tools.');
        } else {
            this.logger.warn('GEMINI_API_KEY not found. AI features disabled.');
        }

        this.commands = new Collection();
        this.commandHandler = new CommandHandler(this);
        this.eventHandler = new EventHandler(this);
        this.applicationService = new ApplicationService(this);
        this.terminal = new TerminalService(this);
        this.music = new MusicService(this);
        this.onboarding = new OnboardingService(this);
        this.suggestions = new SuggestionService(this);
        this.bump = new BumpService(this);
        this.promotions = new PromotionService(this);
        this.modmail = new ModmailService(this);
        this.activityEnforcer = new StaffActivityEnforcer(this);
        this.giveaways = new GiveawayService(this);
        this.weatherAlerts = new WeatherAlertService(this);
        this.staffCompliance = new StaffComplianceService(this);
        this.reminders = new ReminderService(this);
        this.antinuke = new AntinukeService(this);
        this.captcha = new CaptchaService(this);
    }

    public async start() {
        try {
            await this.database.connect();
            await this.commandHandler.load();
            await this.eventHandler.load();

            if (process.argv.includes('--verify-only')) {
                this.logger.info('Verification successful! Exiting as requested by --verify-only flag.');
                await this.database.disconnect();
                process.exit(0);
            }

            await this.login(process.env.DISCORD_TOKEN);
            this.logger.info(`Logged in as ${this.user?.tag}`);
            this.terminal.start();

            // Start 24-hour Staff Sync Task (User Choice 1,3)
            this.startStaffSyncTask();
        } catch (error) {
            this.logger.error('Failed to login:', error);
            process.exit(1);
        }
    }

    private startStaffSyncTask() {
        const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours
        
        const runSync = async () => {
            this.logger.info('[StaffSync] Starting automated 24-hour staff synchronization...');
            try {
                // Since fullStaffSync.ts logic is already written, we'll re-implement the core logic here
                const STAFF_GUILD_ID = '1386826411666309201';
                const guild = await this.guilds.fetch(STAFF_GUILD_ID);
                const members = await guild.members.fetch();
                
                const TIER_MAPPING: Record<string, { name: string, priority: number }> = {
                    '1387636546261487770': { name: 'Founders', priority: 80 },
                    '1387636614699679754': { name: 'Co-Founders', priority: 70 },
                    '1387637435583828129': { name: 'Head of Staff', priority: 60 },
                    '1387637479858901092': { name: 'Senior Admin', priority: 50 },
                    '1387637516055613460': { name: 'Admin', priority: 40 },
                    '1387637559282368655': { name: 'Senior Moderator', priority: 30 },
                    '1387637616882487296': { name: 'Moderator', priority: 20 },
                    '1387736757394473051': { name: 'Trial Staff', priority: 10 }
                };

                const OWNER_IDS = ['753372101540577431', '559552595295731746'];

                for (const [, member] of members) {
                    if (member.user.bot) continue;
                    let tier = '';
                    let priority = 0;
                    let roleName = null;

                    for (const [roleId, data] of Object.entries(TIER_MAPPING)) {
                        if (member.roles.cache.has(roleId)) {
                            if (data.priority > priority) {
                                tier = data.name;
                                priority = data.priority;
                            }
                        }
                    }

                    if (OWNER_IDS.includes(member.id)) {
                        tier = 'Owners';
                        priority = 90;
                        roleName = 'Owner / Founder';
                    }

                    if (!tier) continue;
                    
                    await syncMember(member.user, tier, roleName, priority);
                }

                // Explicitly Sync Owners (Even if not in Staff Guild)
                for (const ownerId of OWNER_IDS) {
                    try {
                        const ownerUser = await this.users.fetch(ownerId);
                        if (ownerUser) {
                            await syncMember(ownerUser, 'Owners', 'Owner / Founder', 90);
                        }
                    } catch (e) {
                        this.logger.error(`[StaffSync] Failed to fetch owner ${ownerId}:`, e);
                    }
                }

                async function syncMember(user: any, tier: string, roleName: string | null, priority: number) {
                    // @ts-ignore
                    await client.prisma.staffMember.upsert({
                        where: { id: user.id },
                        update: {
                            username: user.username,
                            avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' }),
                            tier,
                            role: roleName,
                            priority,
                        },
                        create: {
                            id: user.id,
                            username: user.username,
                            avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' }),
                            tier,
                            role: roleName,
                            priority,
                        }
                    });
                }

                // Export to JSON
                const allStaff = await this.prisma.staffMember.findMany({
                    orderBy: [{ priority: 'desc' }, { username: 'asc' }]
                });

                const webData: Record<string, any[]> = {};
                for (const s of allStaff) {
                    if (!webData[s.tier]) {
                        webData[s.tier] = [];
                    }
                    let color = 'gray';
                    if (s.tier === 'Owners') color = 'neonRed';
                    else if (s.tier === 'Founders') color = 'neonBlue';
                    else if (s.tier === 'Co-Founders') color = 'red';
                    else if (s.tier === 'Head of Staff' || s.tier === 'Senior Admin') color = 'yellow';
                    else if (s.tier === 'Admin' || s.tier === 'Senior Moderator' || s.tier === 'Moderator') color = 'blue';

                    // @ts-ignore
                    webData[s.tier].push({
                        name: s.username,
                        role: s.role,
                        clearance: `Level ${Math.floor(s.priority / 10) + 1}`,
                        color,
                        avatar: s.avatarUrl
                    });
                }

                const tierOrder = ['Owners', 'Founders', 'Co-Founders', 'Executive Board', 'Head of Staff', 'Senior Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Staff'];
                const result = tierOrder.filter(t => webData[t]).map(t => ({ title: t, members: webData[t] }));
                const outPath = path.join(process.cwd(), 'skyalertwx.net', 'data', 'staff.json');
                fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

                this.logger.info('[StaffSync] Automated synchronization task completed successfully.');
            } catch (err) {
                this.logger.error('[StaffSync] Task failed during automation cycle:', err);
            }
        };

        // Initial run
        runSync();
        // Periodic interval
        setInterval(runSync, SYNC_INTERVAL);
    }

    public get prisma() {
        return this.database.prisma;
    }
}
