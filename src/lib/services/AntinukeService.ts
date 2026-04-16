import { Guild, GuildMember, User } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { Logger } from '../../utils/Logger';

interface ActionTracker {
    count: number;
    lastAction: number;
}

export class AntinukeService {
    private client: SkyClient;
    private trackers: Map<string, Map<string, ActionTracker>> = new Map(); // GuildID -> UserID -> Tracker

    // Configuration
    private readonly THRESHOLD = 3; // Max actions allowed
    private readonly WINDOW_MS = 10000; // Time window (10 seconds)
    private readonly WHITELISTED_IDS = ['753372101540577431']; // Pre-defined whitelist (e.g. Owner)

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Records an administrative action and triggers quarantine if threshold is reached.
     */
    public async recordAction(guild: Guild, executor: User, type: 'channel' | 'role' | 'kick' | 'ban') {
        if (this.WHITELISTED_IDS.includes(executor.id)) return;
        if (executor.id === guild.ownerId) return;

        let guildTrackers = this.trackers.get(guild.id);
        if (!guildTrackers) {
            guildTrackers = new Map();
            this.trackers.set(guild.id, guildTrackers);
        }

        const now = Date.now();
        const tracker = guildTrackers.get(executor.id) || { count: 0, lastAction: 0 };

        // Reset if window has passed
        if (now - tracker.lastAction > this.WINDOW_MS) {
            tracker.count = 1;
        } else {
            tracker.count++;
        }

        tracker.lastAction = now;
        guildTrackers.set(executor.id, tracker);

        if (tracker.count >= this.THRESHOLD) {
            await this.quarantine(guild, executor, type);
            guildTrackers.delete(executor.id); // Reset after quarantine
        }
    }

    /**
     * Neutralizes a compromised administrative account.
     */
    private async quarantine(guild: Guild, executorUser: User, type: string) {
        try {
            const member = await guild.members.fetch(executorUser.id).catch(() => null);
            if (!member) return;

            const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id && !r.managed);
            const roleNames = rolesToRemove.map(r => r.name).join(', ') || 'No roles';

            // 1. Strip all roles
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove).catch(e => {
                    this.client.logger.error(`[Antinuke] Failed to strip roles from ${executorUser.tag}:`, e);
                });
            }

            // 2. High-Fidelity Alert
            await Logger.modLog(
                guild,
                'NUKER DETECTED & NEUTRALIZED',
                this.client.user!,
                executorUser,
                `Mass ${type} activity detected (${this.THRESHOLD} actions in <10s).`,
                [
                    { name: '🚫 Action Taken', value: 'System Quarantine (All roles revoked)', inline: true },
                    { name: '🔥 Roles Stripped', value: `\`${roleListTruncated(roleNames)}\``, inline: false }
                ],
                'DarkRed'
            );

            // 3. Notify Owner
            const owner = await guild.fetchOwner();
            if (owner) {
                await owner.send({
                    content: `⚠️ **URGENT:** An antinuke protocol was triggered in **${guild.name}**.\n\n**Culprit:** ${executorUser.tag} (\`${executorUser.id}\`)\n**Reason:** Mass ${type} deletions/kicks detected.\n\nAll permissions for this user have been revoked.`
                }).catch(() => null);
            }

        } catch (err) {
            this.client.logger.error('[Antinuke] Error during quarantine procedure:', err);
        }
    }
}

function roleListTruncated(list: string): string {
    return list.length > 500 ? list.substring(0, 497) + '...' : list;
}
