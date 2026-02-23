import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { TextChannel } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';

export class TerminalService {
    private client: SkyClient;
    private rl: readline.Interface;
    private targetChannelId: string | null = null;
    private pipePath: string;

    constructor(client: SkyClient) {
        this.client = client;
        this.pipePath = path.join(process.cwd(), '.sky_pipe');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'SkySentinel> '
        });
    }

    public start() {
        // Clean up old pipe and start watcher
        if (fs.existsSync(this.pipePath)) fs.unlinkSync(this.pipePath);
        fs.writeFileSync(this.pipePath, '');

        fs.watch(this.pipePath, (eventType) => {
            if (eventType === 'change') {
                const content = fs.readFileSync(this.pipePath, 'utf-8').trim();
                if (content) {
                    // Reset pipe immediately to avoid loops
                    fs.writeFileSync(this.pipePath, '');
                    this.handleCommand(content);
                }
            }
        });

        this.client.logger.info('Terminal Controller Active. Type "help" for a list of commands.');
        this.rl.prompt();

        this.rl.on('line', (line) => {
            this.handleCommand(line);
        });
    }

    private async handleCommand(line: string) {
        const trimmed = line.trim();
        if (!trimmed) {
            this.rl.prompt();
            return;
        }

        const [commandName, ...args] = trimmed.split(' ');
        if (!commandName) {
            this.rl.prompt();
            return;
        }

        try {
            switch (commandName.toLowerCase()) {
                case 'help':
                    console.log(`
Available Commands:
- send <channelId> <message>: Send a message to a specific channel.
- setchannel <channelId>: Set a default channel for the "say" command.
- say <message>: Send a message to the currently set channel.
- eval <script>: Execute arbitrary JavaScript code.
- exit: Shut down the bot.
- help: Show this help menu.
                    `);
                    break;

                case 'send':
                    if (args.length < 2) {
                        console.log('Usage: send <channelId> <message>');
                    } else {
                        const chanId = args[0]!;
                        const content = args.slice(1).join(' ');
                        await this.sendMessage(chanId, content);
                    }
                    break;

                case 'setchannel':
                    if (args.length < 1) {
                        console.log('Usage: setchannel <channelId>');
                    } else {
                        this.targetChannelId = args[0] || null;
                        console.log(`Target channel set to: ${this.targetChannelId}`);
                    }
                    break;

                case 'say':
                    if (!this.targetChannelId) {
                        console.log('No target channel set. Use "setchannel <channelId>" first.');
                    } else if (args.length < 1) {
                        console.log('Usage: say <message>');
                    } else {
                        await this.sendMessage(this.targetChannelId, args.join(' '));
                    }
                    break;

                case 'eval':
                    const code = args.join(' ');
                    try {
                        const result = eval(code);
                        console.log('Result:', result);
                    } catch (e: any) {
                        console.error('Eval Error:', e.message);
                    }
                    break;

                case 'exit':
                    console.log('Shutting down SkySentinel...');
                    if (fs.existsSync(this.pipePath)) fs.unlinkSync(this.pipePath);
                    process.exit(0);
                    break;

                default:
                    console.log(`Unknown command: ${commandName}. Type "help" for commands.`);
                    break;
            }
        } catch (error: any) {
            console.error('[TerminalService] Execution Error:', error.message);
        }

        this.rl.prompt();
    }

    private async sendMessage(channelId: string, content: string) {
        try {
            const channel = await this.client.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                await (channel as TextChannel).send(content);
                console.log(`[TERMINAL -> DISCORD] Sent to ${channelId}: ${content}`);
            } else {
                console.log(`[ERROR] Could not find text channel with ID: ${channelId}`);
            }
        } catch (e: any) {
            console.error('[ERROR] Failed to send message:', e.message);
        }
    }
}
