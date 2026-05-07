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
    public snipes: Collection<string, any>;

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
        this.snipes = new Collection();
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

            // Start Background Services (Staggered to prevent rate limits)
            this.staffCompliance.start();

            setTimeout(() => this.activityEnforcer.start(), 5000);
            setTimeout(() => this.weatherAlerts.start(), 10000);
            setTimeout(() => this.reminders.start(), 15000);

            // Start 24-hour Staff Sync Task (User Choice 1,3)
            setTimeout(() => this.startStaffSyncTask(), 20000);
        } catch (error) {
            this.logger.error('Failed to login:', error);
            process.exit(1);
        }
    }

    public async startStaffSyncTask(manual = false) {
        const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours

        const runSync = async () => {
            if (!manual) this.logger.info('[StaffSync] Starting selective Main Server staff synchronization...');
            try {
                const MAIN_GUILD_ID = '1275838044531855433';
                const STAFF_ROLE_ID = '1276037406696538112';
                const EXCLUDED_PR_ROLE_IDS = [
                    '1474510020350578778', // [PRM] | Public Relations Manager
                    '1474509849218781204', // [PRA] | Public Relations Associate
                    '1473861192941568271'  // Staffing - Public Relations Manager
                ];

                const PREFIX_MAPPING: Record<string, { name: string, priority: number }> = {
                    '[F]': { name: 'Founders', priority: 80 },
                    '[CF]': { name: 'Co-Founders', priority: 70 },
                    '[CF/EB]': { name: 'Co-Founders', priority: 70 },
                    '[EB]': { name: 'Executive Board', priority: 65 },
                    '[HOS]': { name: 'Head of Staff', priority: 60 },
                    '[HOS/S]': { name: 'Head of Staff', priority: 60 },
                    '[SRA]': { name: 'Senior Admin', priority: 50 },
                    '[A]': { name: 'Admin', priority: 40 },
                    '[SRM]': { name: 'Senior Moderator', priority: 30 },
                    '[MOD]': { name: 'Moderator', priority: 20 },
                    '[TS]': { name: 'Trial Staff', priority: 10 }
                };

                const OWNER_IDS = [
                    '753372101540577431', // VixWx
                    '559552595295731746', // Jasmine
                    '1279672537873252405'  // equinoxicon.0 (GermanyIsCountry) - Co-Founder
                ];

                const guild = await this.guilds.fetch(MAIN_GUILD_ID);
                const members = await guild.members.fetch();

                let syncCount = 0;

                const syncMember = async (user: any, tier: string, roleName: string | null, priority: number) => {
                    await this.prisma.staffMember.upsert({
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
                };

                for (const [, member] of members) {
                    if (member.user.bot) continue;

                    const isOwner = OWNER_IDS.includes(member.id);
                    const isStaff = member.roles.cache.has(STAFF_ROLE_ID);
                    const isPR = member.roles.cache.some(r =>
                        EXCLUDED_PR_ROLE_IDS.includes(r.id) ||
                        r.name.toLowerCase().includes("public relations")
                    );

                    // Membership Filter
                    if (!isOwner && (!isStaff || isPR)) continue;

                    let tier = 'Network Staff';
                    let priority = 5;
                    let roleDisplayName = 'Staff Member';

                    const nickname = (member.nickname || member.user.username).toString();

                    // Priority 1: Match Prefix
                    for (const [prefix, data] of Object.entries(PREFIX_MAPPING)) {
                        const cleanPrefix = prefix.replace(']', ''); // e.g., '[A'

                        // Rule: If nickname has a /, the first prefix is the role
                        if (nickname.includes(prefix) || (nickname.includes('/') && nickname.includes(cleanPrefix + '/'))) {
                            tier = data.name;
                            priority = data.priority;
                            roleDisplayName = tier;
                            break;
                        }
                    }

                    // Priority 2: Hard-set Owners
                    if (isOwner) {
                        tier = 'Owners';
                        priority = 90;
                        roleDisplayName = 'Owner / Founder';
                    }

                    await syncMember(member.user, tier, roleDisplayName, priority);
                    syncCount++;
                }

                // Explicitly Sync Owners
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

                // Export to JSON for website
                const allStaff = await this.prisma.staffMember.findMany({
                    orderBy: [{ priority: 'desc' }, { username: 'asc' }]
                });

                const webData: Record<string, any[]> = {};
                for (const s of allStaff) {
                    if (!webData[s.tier]) webData[s.tier] = [];

                    let color = 'gray';
                    if (s.tier === 'Owners') color = 'neonRed';
                    else if (s.tier === 'Founders') color = 'neonBlue';
                    else if (s.tier === 'Co-Founders') color = 'red';
                    else if (s.tier === 'Executive Board') color = 'red';
                    else if (s.tier === 'Head of Staff' || s.tier === 'Senior Admin') color = 'yellow';
                    else if (s.tier === 'Admin' || s.tier === 'Senior Moderator' || s.tier === 'Moderator') color = 'blue';

                    // @ts-ignore
                    webData[s.tier].push({
                        name: s.username,
                        role: s.role,
                        clearance: `Level ${Math.floor(s.priority / 10) + 1}`,
                        color,
                        avatar: s.avatarUrl,
                        nda: s.hasSignedNDA
                    });
                }

                const tierOrder = ['Owners', 'Founders', 'Co-Founders', 'Executive Board', 'Head of Staff', 'Senior Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Staff', 'Network Staff'];
                const result = tierOrder.filter(t => webData[t] && webData[t].length > 0).map(t => ({ title: t, members: webData[t] }));
                const outPath = path.join(process.cwd(), 'skyalertwx.net', 'data', 'staff.json');
                fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

                if (!manual) this.logger.info(`[StaffSync] Selective sync completed. Processed ${syncCount} staff members.`);
            } catch (err) {
                this.logger.error('[StaffSync] Automation task failed:', err);
            }
        };

        // Initial run if not manual
        if (!manual) {
            runSync();
            setInterval(runSync, SYNC_INTERVAL);
        } else {
            await runSync();
        }
    }

    public get prisma() {
        return this.database.prisma;
    }
}
