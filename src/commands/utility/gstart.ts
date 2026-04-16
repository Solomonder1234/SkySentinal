import { PermissionFlagsBits, TextChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'gstart',
    description: 'Starts a giveaway in the current channel.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild || !message.channel) return;

        // !gstart 1h 1 Nitro Classic
        if (args.length < 3) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Usage', 'Format: `!gstart <time> <winners> <prize>`\nExample: `!gstart 1h 1 Nitro Classic`')] });
        }

        const durationStr = args[0] || '';
        const winnersStr = args[1] || '';
        const prize = args.slice(2).join(' ');

        const durationMs = parseTime(durationStr);
        if (!durationMs) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Time', 'Please provide a valid duration (e.g. `10m`, `1h`, `1d`).')] });
        }

        const winners = parseInt(winnersStr);
        if (isNaN(winners) || winners < 1) {
            return message.reply({ embeds: [EmbedUtils.error('Invalid Winners', 'Please provide a valid number of winners (minimum 1).')] });
        }

        try {
            await client.giveaways.startGiveaway(message.channel as TextChannel, message.author.id, durationMs, winners, prize);
            await message.delete().catch(() => null);
        } catch (err: any) {
            client.logger.error('[GiveawayCommand] Global Error:', err);
            await message.reply('❌ Failed to start the giveaway. Check bot permissions.');
        }
    }
} as Command;

function parseTime(str: string): number | null {
    const regex = /^(\d+)([smhd])$/;
    const match = str.match(regex);
    if (!match || !match[1]) return null;

    const val = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return val * 1000;
        case 'm': return val * 60 * 1000;
        case 'h': return val * 3600 * 1000;
        case 'd': return val * 86400 * 1000;
        default: return null;
    }
}
