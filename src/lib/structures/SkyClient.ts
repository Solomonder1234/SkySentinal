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

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildVoiceStates,
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
        } catch (error) {
            this.logger.error('Failed to login:', error);
            process.exit(1);
        }
    }
}
