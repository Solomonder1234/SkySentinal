import { Collection, CommandInteraction, Message } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { Command } from '../structures/Command';
import fs from 'fs';
import path from 'path';
import { OWNER_IDS } from '../../config';

export class CommandHandler {
    private client: SkyClient;
    private cooldowns = new Collection<string, Collection<string, number>>();

    constructor(client: SkyClient) {
        this.client = client;
    }

    public async load() {
        const commandsPath = path.join(__dirname, '../../commands');
        if (!fs.existsSync(commandsPath)) return;

        const commandFiles = this.getFiles(commandsPath);

        for (const file of commandFiles) {
            const command: Command = require(file).default;
            if (!command || !command.name) continue;

            // Assign category based on folder name
            const category = path.basename(path.dirname(file));
            command.category = category.charAt(0).toUpperCase() + category.slice(1);

            this.client.commands.set(command.name, command);
            this.client.logger.info(`Loaded command: ${command.name}`);
        }
    }

    private getFiles(dir: string): string[] {
        const files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                files.push(...this.getFiles(path.join(dir, item.name)));
            } else if ((item.name.endsWith('.ts') || item.name.endsWith('.js')) && !item.name.endsWith('.d.ts')) {
                files.push(path.join(dir, item.name));
            }
        }

        return files;
    }

    public async handle(interaction: CommandInteraction) {
        const command = this.client.commands.get(interaction.commandName);
        if (!command) return;

        // Cooldown enforcement
        if (!OWNER_IDS.includes(interaction.user.id)) {
            if (!this.cooldowns.has(command.name)) {
                this.cooldowns.set(command.name, new Collection());
            }

            const now = Date.now();
            const timestamps = this.cooldowns.get(command.name)!;
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return interaction.reply({
                        content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`,
                        ephemeral: true
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        }

        try {
            await command.run(this.client, interaction);
        } catch (error) {
            this.client.logger.error(`Error executing command ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }

    public async handleMessage(message: Message, prefix: string = '!') {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        const command = this.client.commands.get(commandName) ||
            this.client.commands.find(cmd => cmd.aliases?.includes(commandName));

        if (!command) return;

        // Check permissions for message commands
        if (command.defaultMemberPermissions) {
            if (!OWNER_IDS.includes(message.author.id) && !message.member?.permissions.has(command.defaultMemberPermissions)) {
                await message.reply({ content: 'You do not have permission to use this command.' });
                return;
            }
        }

        // Cooldown enforcement
        if (!OWNER_IDS.includes(message.author.id)) {
            if (!this.cooldowns.has(command.name)) {
                this.cooldowns.set(command.name, new Collection());
            }

            const now = Date.now();
            const timestamps = this.cooldowns.get(command.name)!;
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    const msg = await message.reply({
                        content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
                    });
                    setTimeout(() => msg.delete().catch(() => { }), 5000);
                    return;
                }
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        }

        try {
            await command.run(this.client, message);
        } catch (error) {
            this.client.logger.error(`Error executing command ${commandName}:`, error);
            await message.reply({ content: 'There was an error while executing this command!' });
        }
    }
}
