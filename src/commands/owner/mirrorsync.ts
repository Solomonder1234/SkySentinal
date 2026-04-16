import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits, Role } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';

const SOURCE_GUILD_ID = '1275838044531855433'; // Main Server
const STAFF_PREFIXES = ['[F]', '[CF]', '[EB]', '[HOS]', '[SRA]', '[A]', '[SRM]', '[MOD]', '[TS]', '[ST]', '[PRM]', '[PRA]', '[FS]'];

export default {
    name: 'mirrorsync',
    description: 'Mirrors the staff hierarchy from the Main Server and syncs members.',
    category: 'Owner',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const user = (interaction instanceof Message) ? interaction.author : interaction.user;
        if (!OWNER_IDS.includes(user.id)) return;

        if (!(interaction instanceof Message)) {
            await interaction.deferReply();
        } else {
            // Provide immediate feedback for message command
            const channel: any = interaction.channel;
            await channel?.send({ embeds: [EmbedUtils.info('Mirror Protocol Initiated', 'Beginning staff hierarchy synchronization...')] });
        }

        try {
            const targetGuild = interaction.guild;
            const sourceGuild = await client.guilds.fetch(SOURCE_GUILD_ID);

            if (!sourceGuild || !targetGuild) {
                const err = EmbedUtils.error('Sync Failed', 'Source or Target guild could not be identified.');
                return (interaction instanceof Message) ? interaction.reply({ embeds: [err] }) : interaction.editReply({ embeds: [err] });
            }

            // 1. Fetch Source Roles
            const sourceRoles = await sourceGuild.roles.fetch();
            const staffRoles = sourceRoles.filter(r => 
                STAFF_PREFIXES.some(px => r.name.toUpperCase().startsWith(px)) || 
                r.name.toLowerCase().includes('head of staff') ||
                r.name.toLowerCase().includes('staffing -')
            ).sort((a, b) => b.position - a.position);

            // 2. Mirror Structure in Target
            const roleMap: Map<string, Role> = new Map();
            let rolesCreated = 0;
            
            for (const [, sRole] of staffRoles) {
                let tRole = targetGuild.roles.cache.find((r: Role) => r.name === sRole.name);
                
                if (!tRole) {
                    tRole = await targetGuild.roles.create({
                        name: sRole.name,
                        color: sRole.color,
                        hoist: true,
                        mentionable: sRole.mentionable,
                        reason: 'SkySentinel Deployment: Mirror Protocol 7-B'
                    });
                    rolesCreated++;
                } else if (!tRole.hoist) {
                    await tRole.setHoist(true).catch(() => {});
                }
                roleMap.set(sRole.id, tRole);
            }

            // 3. Synchronize Members
            const targetMembers = await targetGuild.members.fetch();
            const sourceMembers = await sourceGuild.members.fetch();

            let syncCount = 0;
            for (const [, tMember] of targetMembers) {
                if (tMember.user.bot) continue;

                const sMember = sourceMembers.get(tMember.id);
                if (!sMember) continue;

                const rolesToApply: string[] = [];
                for (const [sRoleId, tRole] of roleMap) {
                    if (sMember.roles.cache.has(sRoleId)) {
                        rolesToApply.push(tRole.id);
                    }
                }

                if (rolesToApply.length > 0) {
                    await tMember.roles.add(rolesToApply).catch(() => {});
                    syncCount++;
                }
            }

            const successEmbed = EmbedUtils.success(
                'Intelligence Mirror Complete',
                `Successfully synchronized the staff hierarchy between servers.\n\n` +
                `**Target Server:** ${targetGuild.name}\n` +
                `**Roles Processed:** \`${staffRoles.size}\` (Created \`${rolesCreated}\` new roles)\n` +
                `**Members Synchronized:** \`${syncCount}\``
            ).setFooter({ text: 'SkySentinel AV • Sync Directive 7-B' });

            if (interaction instanceof Message) {
                const channel: any = interaction.channel;
                return channel?.send({ embeds: [successEmbed] });
            } else {
                return interaction.editReply({ embeds: [successEmbed] });
            }
            
        } catch (error) {
            client.logger.error('MirrorSync Error:', error);
            const errEmbed = EmbedUtils.error('Protocol Error', 'An unexpected error occurred during the synchronization cycle.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errEmbed] });
            } else {
                return interaction.editReply({ embeds: [errEmbed] });
            }
        }
    },
} as Command;
