import { SkyClient } from '../structures/SkyClient';
import { Event } from '../structures/Event';
import fs from 'fs';
import path from 'path';
import { ClientEvents } from 'discord.js';

export class EventHandler {
    private client: SkyClient;

    constructor(client: SkyClient) {
        this.client = client;
    }

    public async load() {
        const eventsPath = path.join(__dirname, '../../events');
        if (!fs.existsSync(eventsPath)) return;

        const eventFiles = this.getFiles(eventsPath);

        for (const file of eventFiles) {
            const event: Event<keyof ClientEvents> = require(file).default;
            if (!event || !event.name) continue;

            if (event.once) {
                this.client.once(event.name, (...args) => event.run(this.client, ...args));
            } else {
                this.client.on(event.name, (...args) => event.run(this.client, ...args));
            }
            this.client.logger.info(`Loaded event: ${event.name}`);
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
}
