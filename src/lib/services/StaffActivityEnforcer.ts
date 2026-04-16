import { TextChannel, EmbedBuilder } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

export class StaffActivityEnforcer {
    private client: SkyClient;
    private checkInterval: NodeJS.Timeout | null = null;
    
    // Inactivity threshold = 14 Days
    private readonly INACTIVITY_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; 

    // Keywords to identify staff roles that should be aggressively stripped
    private readonly STAFF_KEYWORDS = ['staff', 'mod', 'admin', 'management', 'owner'];

    constructor(client: SkyClient) {
        this.client = client;
    }

    public start() {
        // Run immediately on boot, then every 24 hours
        this.runSweep();
        this.checkInterval = setInterval(() => {
            this.runSweep();
        }, 24 * 60 * 60 * 1000); 
        this.client.logger.info('[StaffActivityEnforcer] 14-day chronological staff activity daemon initialized.');
    }

    public stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private async runSweep() {
        this.client.logger.info('[StaffActivityEnforcer] Executing chronological sweep for inactive staff...');
        
        try {
            // Re-fetch all guilds the bot is in
            for (const guild of this.client.guilds.cache.values()) {
                const config = await this.client.database.prisma.guildConfig.findUnique({
                    where: { id: guild.id }
                });
                
                if (!config) continue;

                // Find roles that classify as "Staff"
                const staffRoles = guild.roles.cache.filter(role => 
                    this.STAFF_KEYWORDS.some(k => role.name.toLowerCase().includes(k))
                );

                if (staffRoles.size === 0) continue;

                // Fetch all members to ensure cache is alive
                await guild.members.fetch();

                const logChannel = config.modLogChannelId 
                    ? guild.channels.cache.get(config.modLogChannelId) as TextChannel 
                    : null;

                const cutoffTime = new Date(Date.now() - this.INACTIVITY_THRESHOLD_MS);

                // Collect all members who have AT LEAST ONE staff-classified role
                for (const member of guild.members.cache.values()) {
                    if (member.user.bot) continue;

                    const memberStaffRoles = member.roles.cache.filter(r => staffRoles.has(r.id));
                    if (memberStaffRoles.size === 0) continue; // Not a staff member

                    // Check their activity timeline in Prisma
                    const profile = await this.client.database.prisma.userProfile.findUnique({
                        where: { id: member.id }
                    });

                    // If profile doesn't exist, they literally never sent a single message since tracking began
                    // If profile.updatedAt is older than cutoffTime, they are chronically inactive
                    const lastActive = profile?.updatedAt || profile?.createdAt || null;

                    if (!lastActive || lastActive < cutoffTime) {
                        
                        // User requested condition: Ensure they are NOT on an active Leave of Absence (LOA)
                        const activeLoa = await this.client.database.prisma.lOA.findFirst({
                            where: {
                                guildId: guild.id,
                                userId: member.id,
                                status: "APPROVED"
                            }
                        });

                        // Executive Immunity: Co-Founders, and Executive Board are NEVER demoted
                        const isExecutiveTier = member.roles.cache.some(r => {
                            const n = r.name.toLowerCase();
                            return n.includes('founder') || n.includes('executive board') || n.includes('co-founder');
                        });

                        if (activeLoa || isExecutiveTier) {
                            if (activeLoa) {
                                this.client.logger.info(`[StaffActivityEnforcer] Skipped ${member.user.tag} (Demotion evaded due to active LOA).`);
                            } else {
                                this.client.logger.info(`[StaffActivityEnforcer] Skipped ${member.user.tag} (Demotion evaded due to Executive Immunity).`);
                            }
                            continue;
                        }

                        // Time to demote!
                        try {
                            const removedRolesList = memberStaffRoles.map(r => r.name).join(', ');

                            // Execute Role Stripping
                            for (const roleId of memberStaffRoles.keys()) {
                                await member.roles.remove(roleId).catch(() => null);
                            }

                            this.client.logger.info(`[StaffActivityEnforcer] Terminated ${member.user.tag} for 14+ day inactivity. Stripped: ${removedRolesList}`);
                            
                            // Send termination DM to the demoted staff member
                            const dmEmbed = new EmbedBuilder()
                                .setTitle('⚠️ Automated Demotion Notice')
                                .setColor(0xFF0000)
                                .setDescription(`You have been automatically demoted from your Staff position in **${guild.name}** due to chronic inactivity.\n\n**Reason:** No messages sent in over **14 days**.\n**Roles Stripped:** \`${removedRolesList}\``)
                                .setFooter({ text: 'Activity Enforcer Daemon' })
                                .setTimestamp();

                            await member.send({ embeds: [dmEmbed] }).catch(() => null);

                            // Construct a formal logging embed for the administration channel
                            if (logChannel) {
                                const logEmbed = EmbedUtils.error(
                                    '🛡️ Automated Staff Termination',
                                    `**Target:** ${member.toString()} (\`${member.id}\`)\n**Reason:** Chronic Inactivity (Failure to engage for > 14 Days)\n\n**Stripped Clearances:**\n\`${removedRolesList}\``
                                ).setTimestamp()
                                 .setFooter({ text: `Last Active: ${lastActive ? lastActive.toDateString() : 'Never'}` });

                                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
                            }

                        } catch (err) {
                            this.client.logger.error(`[StaffActivityEnforcer] Critical error stripping roles from ${member.id}:`, err);
                        }
                    }
                }
            }
        } catch (error) {
            this.client.logger.error('[StaffActivityEnforcer] Daemon scan crashed heavily:', error);
        }
    }
}
