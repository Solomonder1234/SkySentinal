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
    run: (client: SkyClient, interaction: CommandInteraction | Message) => Promise<any>;
    autocomplete?: (client: SkyClient, interaction: AutocompleteInteraction) => Promise<any>;
}
