import { ClientEvents } from 'discord.js';
import { SkyClient } from './SkyClient';

export interface Event<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    run: (client: SkyClient, ...args: ClientEvents[K]) => Promise<any>;
}
