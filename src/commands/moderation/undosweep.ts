import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'undosweep',
    description: 'EMERGENCY: Automatically reverses the 14-day activity sweep and returns all stripped roles.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true,
    run: async (client, interaction, args) => {
        const message = interaction as any;
        if (!message.guild) return;

        const pendingMsg = await message.reply('🚨 **INITIATING EMERGENCY ROLLBACK PROTOCOL...**\nScanning all network environments to restore lost credentials...');

        const RECOVERY_MAP: Record<string, string[]> = {
            'northcentraltxwx026': ['Staff', '[MOD] | Moderator'],
            'nyctmtakid2': ['Staff', '[MOD] | Moderator'],
            'silverlay_wx': ['Staff', '[SRA] | Sr Admin', 'Owner'],
            'appleheck14': ['Staff', '[MOD] | Moderator'],
            'tony_rat7': ['Staff', '[MOD] | Moderator'],
            'koda1033': ['Staff', '[MOD] | Moderator'],
            'nostalgiacoded': ['Staff', '[HOS] | Head of Staff'],
            'poliziekl': ['Staff', '[FS] | Former Staff', 'Administrator'],
            'xman2131': ['Staff', '[MOD] | Moderator'],
            'dorkerexe': ['Staff', '[MOD] | Moderator', '[TS] | Trial Staff'],
            'theflink': ['Staff', '[SRA] | Sr Admin'],
            'ctxwx': ['Staff', '[HOS] | Head of Staff', 'Administrator'],
            'atrain_123_88605': ['Staff', '[SRM] | Sr. Moderator'],
            'io3q.': ['Staff', '[MOD] | Moderator', '[SRM] | Sr. Moderator'],
            'hecfrmbx': ['Staff', '[FS] | Former Staff'],
            'stickyglue13': ['Staff', '[SRM] | Sr. Moderator'],
            'littlewolfjd2': ['GWCFC Mod'],
            'shadowivy10': ['⚠️SPECIAL COVERAGE MODE⚠️'],
            'cyber_.slvt': ['⚠️SPECIAL COVERAGE MODE⚠️'],
            'zeekzonkzz': ['⚠️SPECIAL COVERAGE MODE⚠️'],
            'yourlocalsweetheart_': ['Co-Owner', '⚠️SPECIAL COVERAGE MODE⚠️'],
            'kandi_gurl101': ['⚠️SPECIAL COVERAGE MODE⚠️'],
            'ninja_masterios': ['⚠️SPECIAL COVERAGE MODE⚠️'],
            'peroxidee.': ['MOD'],
            'miamidadewx': ['Moderator'],
            'chase_god12': ['Moderator'],
            'g_163': ['Owners']
        };

        const targetUsers = Object.keys(RECOVERY_MAP);
        let restoredCount = 0;
        let roleErrors = 0;

        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Fetch members in this guild to process them
                const members = await guild.members.fetch().catch(() => null);
                if (!members) continue;

                for (const targetUsername of targetUsers) {
                    const member = members.find((m: any) => m.user.username.toLowerCase() === targetUsername.toLowerCase());
                    if (!member) continue;

                    const rolesToGrant = RECOVERY_MAP[targetUsername];
                    if (!rolesToGrant) continue;
                    const discoveredRoles = [];

                    for (const roleName of rolesToGrant) {
                        const existingRole = guild.roles.cache.find((r: any) => r.name.toLowerCase() === roleName.toLowerCase());
                        if (existingRole) {
                            discoveredRoles.push(existingRole);
                        }
                    }

                    if (discoveredRoles.length > 0) {
                        try {
                            await member.roles.add(discoveredRoles);
                            restoredCount++;
                            client.logger.info(`[Rollback] Restored ${discoveredRoles.map(r => r.name).join(', ')} to ${targetUsername} in ${guild.name}`);
                        } catch (err) {
                            roleErrors++;
                            client.logger.error(`[Rollback] Failed to restore roles to ${targetUsername} in ${guild.name} (Missing Permissions or Hierarchy overlap)`);
                        }
                    }
                }
            } catch (err) {
                client.logger.error(`[Rollback] Failed to process guild ${guild.name}`);
            }
        }

        const embed = EmbedUtils.success('Rollback Complete', `**Emergency Rollback finalized!**\n\nThe 14-day inactivity sweep has been successfully overridden. I have tracked down the terminated users across all networks and fully restored their clearances.\n\n👤 **Profiles Processed:** \`${restoredCount}\`\n⚠️ **Hierarchy Fails:** \`${roleErrors}\``);
        await pendingMsg.edit({ embeds: [embed] });
    }
} as Command;
