import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'warn',
    description: 'Warns a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'user',
            description: 'The user to warn.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the warning.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let reason = 'No reason provided';
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user to warn.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
                reason = args.slice(1).join(' ');
                if (!reason) return interaction.reply({ content: 'Please provide a reason.' });
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = interaction.guild?.members.cache.get(user.id);
            reason = chatInteraction.options.getString('reason', true);
        }

        if (!interaction.guild) return;

        // Create warning in database
        try {
            // Ensure GuildConfig exists
            await client.database.prisma.guildConfig.upsert({
                where: { id: interaction.guild.id },
                create: { id: interaction.guild.id },
                update: {},
            });

            const caseRecord = await client.database.prisma.case.create({
                data: {
                    guildId: interaction.guild.id,
                    targetId: user.id,
                    moderatorId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
                    type: 'WARN',
                    reason: reason,
                },
            });

            const successEmbed = EmbedUtils.success('User Warned', `**${user.tag}** has been warned.\nReason: ${reason}\nCase ID: #${caseRecord.id}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

            // Dm user
            try {
                const dmEmbed = EmbedUtils.error('You were warned', `Server: ${interaction.guild.name}\nReason: ${reason}`);
                await user.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore if DMs are closed
            }

        } catch (error) {
            client.logger.error(`Failed to warn user ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Warn Failed', 'An error occurred while creating the warning.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
