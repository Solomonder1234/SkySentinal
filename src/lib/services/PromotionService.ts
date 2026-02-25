import { PrismaClient, UserProfile } from '@prisma/client';
import { SkyClient } from '../structures/SkyClient';
import { GuildMember, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export class PromotionService {
    private client: SkyClient;
    private prisma: PrismaClient;

    constructor(client: SkyClient) {
        this.client = client;
        this.prisma = client.database.prisma;
    }

    /**
     * Check if a user is eligible for any promotions and apply them.
     */
    public async checkPromotion(member: GuildMember, profile: UserProfile) {
        if (!member.guild) return;

        const config = await (this.prisma.guildConfig as any).findUnique({
            where: { id: member.guild.id },
            include: { promotionRules: true }
        });

        if (!config || !(config as any).promotionRules || (config as any).promotionRules.length === 0) return;

        // Removed the hardcoded staff-only restriction so auto-promotions apply to all global users.

        // Calculate Days in Server
        const daysInServer = Math.floor((Date.now() - member.joinedTimestamp!) / (1000 * 60 * 60 * 24));

        // Find all rules the user meets
        const eligibleRules = ((config as any).promotionRules as any[]).filter(rule => {
            if (!/^\d{17,19}$/.test(rule.roleId)) return false;
            if (rule.type === 'LEVEL') return profile.level >= rule.requirement;
            if (rule.type === 'MESSAGES') return (profile as any).messageCount >= rule.requirement;
            if (rule.type === 'DAYS') return daysInServer >= rule.requirement;
            return false;
        });

        if (eligibleRules.length === 0) return;

        // Find the "highest" rule based on requirement value (assuming higher requirement = higher rank)
        const highestRule = eligibleRules.sort((a: any, b: any) => b.requirement - a.requirement)[0];

        // Check if user already has the role
        if (member.roles.cache.has(highestRule.roleId)) return;

        try {
            // Apply new role
            await member.roles.add(highestRule.roleId);

            // Handle Stacking: Remove old promotion roles if disabled
            if (!(config as any).stackPromotions) {
                const otherPromotionRoles = ((config as any).promotionRules as any[])
                    .filter(r => r.id !== highestRule.id)
                    .map(r => r.roleId);

                for (const oldRoleId of otherPromotionRoles) {
                    if (member.roles.cache.has(oldRoleId)) {
                        await member.roles.remove(oldRoleId).catch(() => { });
                    }
                }
            }

            // Handle Nickname Prefixing
            if (highestRule.nicknamePrefix) {
                const currentNickname = member.nickname || member.user.username;
                let baseName = currentNickname.replace(/^\[.*?\]\s*|\{.*?\}\s*|\|.*?\|\s*/g, '').trim();
                const newNickname = `[${highestRule.nicknamePrefix}] ${baseName}`.substring(0, 32);

                await member.setNickname(newNickname).catch(err => {
                    this.client.logger.warn(`Could not set nickname for ${member.user.tag}: ${err.message}`);
                });
            }

            // Notify in leveling channel or current channel
            let targetChannel: any = null;
            if (config.levelUpChannelId) {
                targetChannel = member.guild.channels.cache.get(config.levelUpChannelId);
            }

            const embed = EmbedUtils.success(
                '🎖️ Promotion Authorized',
                `Congratulations <@${member.id}>! You have been promoted for your outstanding activity.\n\n` +
                `**New Rank:** <@&${highestRule.roleId}>\n` +
                `**Requirement Met:** ${highestRule.requirement} (${highestRule.type})`
            );

            if (targetChannel && 'send' in targetChannel) {
                await targetChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            this.client.logger.error(`[PromotionService] Error promoting ${member.id}:`, error);
        }
    }
}
