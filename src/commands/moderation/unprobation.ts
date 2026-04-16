import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unprobation',
    description: 'Cancels a user\'s probation period, preventing them from being automatically re-banned.',
    aliases: ['removeprobation', 'delprobation'],
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'user_id',
            description: 'The ID of the user to remove from probation.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for removing probation.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction, args) => {
        let userId = '';
        let reason = 'Probation manually cleared by staff.';

        if (interaction instanceof Message) {
            userId = (args && args[0]) ? args[0].replace(/[<@!>]/g, '') : '';
            reason = (args && args.length > 1) ? args.slice(1).join(' ') : reason;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            userId = chatInteraction.options.getString('user_id', true);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!userId) return interaction.reply({ content: 'Please provide a valid User ID.' });

        const guild = interaction.guild;
        if (!guild) return;

        try {
            // Find active probation case
            const probationCase = await client.database.prisma.case.findFirst({
                where: {
                    guildId: guild.id,
                    targetId: userId,
                    type: 'PROBATION',
                    active: true,
                }
            });

            if (!probationCase) {
                return interaction.reply({ embeds: [EmbedUtils.error('No Active Probation', 'That user does not have an active probation period tracking record.')] });
            }

            // Deactivate the case
            await client.database.prisma.case.update({
                where: { id: probationCase.id },
                data: { active: false }
            });

            const successEmbed = EmbedUtils.success('Probation Successfully Lifted', 
                `The trial period for <@${userId}> (ID: \`${userId}\`) has been cancelled.\n\n**Outcome:** This user will **NOT** be automatically re-banned by the system.\n**Reason:** ${reason}`
            );

            await interaction.reply({ embeds: [successEmbed] });

            // Try to DM the user
            const targetUser = await client.users.fetch(userId).catch(() => null);
            if (targetUser) {
                const dmEmbed = EmbedUtils.success('Probation Successfully Cleared', 
                    `Your trial period in **${guild.name}** has been manually cleared by the staff team.\n\nYou are no longer scheduled for a re-ban and have been fully restored to the community.\n\n**Staff Reason:** ${reason}`
                );
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);
            }

        } catch (error) {
            client.logger.error(`Failed to remove probation for ${userId}:`, error);
            await interaction.reply({ content: 'An error occurred while trying to clear the probation record.' });
        }
    }
} as Command;
