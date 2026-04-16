import {
    CommandInteraction,
    ChatInputApplicationCommandData,
    AutocompleteInteraction,
    Message
} from 'discord.js';
import { SkyClient } from './SkyClient';

export interface Command extends ChatInputApplicationCommandData {
    category?: string;
    aliases?: string[];
    prefixOnly?: boolean;
    cooldown?: number;
    clearanceLevel?: number; // 1–6 matching the SkyAlert clearance hierarchy
    run: (client: SkyClient, interaction: any, args: string[]) => Promise<any>;
    autocomplete?: (client: SkyClient, interaction: AutocompleteInteraction) => Promise<any>;
}
