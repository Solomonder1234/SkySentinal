import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'revokestrike',
    description: 'Revokes an existing strike from a user (Server Owner Only).',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'case_id',
            description: 'The Case ID of the strike to revoke.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        // Enforce HOS (Head of Staff) to Founder Roles Only
        let hasPermission = false;
        if (interaction.member?.user.id === interaction.guild?.ownerId) {
            hasPermission = true;
        } else if (interaction.member && interaction.guild) {
            const memberRoles = interaction.member.roles as any;
            const guildRoles = interaction.guild.roles.cache;

            // Find the Head of Staff role to get its baseline position
            const hosRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'head of staff' || r.name.toLowerCase() === 'hos');
            const founderRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'founder');

            // If user has Administrator, let them do it just in case
            if (memberRoles.cache && memberRoles.cache.some((r: any) => r.permissions && r.permissions.has('Administrator'))) {
                hasPermission = true;
            }

            // Check if highest role is >= HOS role position
            if (hosRole && memberRoles.highest && memberRoles.highest.position >= hosRole.position) {
                hasPermission = true;
            }

            // Explicit name check just in case
            if (memberRoles.cache && memberRoles.cache.some((r: any) => ['founder', 'head of staff', 'hos'].includes(r.name.toLowerCase()))) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            const errorEmbed = EmbedUtils.error('Access Denied', 'This command is restricted to the **Head of Staff** and **Founder** roles.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        let caseId: number;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide a valid Case ID.' });

            caseId = parseInt(args[0]);
            if (!caseId || isNaN(caseId)) return interaction.reply({ content: 'Please provide a valid Case ID.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            caseId = chatInteraction.options.getInteger('case_id', true);
        }

        if (!interaction.guild) return;

        try {
            // Find the strike
            const caseRecord = await client.database.prisma.case.findUnique({
                where: { id: caseId }
            });

            if (!caseRecord || caseRecord.guildId !== interaction.guild.id || caseRecord.type !== 'STRIKE') {
                const errorEmbed = EmbedUtils.error('Not Found', `Could not find a valid Strike with Case ID **#${caseId}**.`);
                if (interaction instanceof Message) {
                    return interaction.reply({ embeds: [errorEmbed] });
                } else {
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }

            // Delete the strike
            await client.database.prisma.case.delete({
                where: { id: caseId }
            });

            // Count total strikes remaining
            const totalStrikes = await client.database.prisma.case.count({
                where: {
                    guildId: interaction.guild.id,
                    targetId: caseRecord.targetId,
                    type: 'STRIKE'
                }
            });

            const ansiContent = `\`\`\`ansi\n\u001b[1;36mOfficial Record Expungement\u001b[0m\n\u001b[0;34mCase\u001b[0m \u001b[1;37m#${caseId}\u001b[0m \u001b[0;34mhas been formally revoked and expunged from the record of\u001b[0m \u001b[1;37m${caseRecord.targetId}\u001b[0m\n\n\u001b[1;36mAccount Status Impact\u001b[0m\n\u001b[0;34mThis specific infraction has been completely deleted from the central database.\u001b[0m\n\n\u001b[1;36mCurrent Standing\u001b[0m\n\u001b[0;34mThe user currently has\u001b[0m \u001b[1;37m${totalStrikes}\u001b[0m \u001b[0;34mformal strikes remaining on their permanent record.\u001b[0m\n\`\`\``;

            const successEmbed = EmbedUtils.success(
                'Formal Strike Revocation Notice',
                `<@${caseRecord.targetId}>\n${ansiContent}`
            );

            // Log to specific channel
            try {
                const logChannelId = '1371279072067321896';
                const logChannel = await interaction.guild.channels.fetch(logChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    await logChannel.send({ embeds: [successEmbed] });
                }
            } catch (err) {
                client.logger.error('Failed to send strike revoke log to defined channel:', err);
            }

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error(`Failed to revoke strike #${caseId}:`, error);
            const errorEmbed = EmbedUtils.error('Revoke Failed', 'An error occurred while revoking the strike.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
