import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'watch',
    description: 'Manage the user watch list. Watched users have their messages logged.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: 'add',
            description: 'Add a user to the watch list.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to watch.',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for watching this user.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Remove a user from the watch list.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to untrack.',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'list',
            description: 'List all currently watched users.',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        // Extract subcommand handling
        let subCommand = '';
        let targetUser = null;
        let reason = null;

        if (interaction instanceof ChatInputCommandInteraction) {
            subCommand = interaction.options.getSubcommand();
            targetUser = interaction.options.getUser('user');
            reason = interaction.options.getString('reason');
        } else {
            // Primitive prefix fallback (rarely used for complex subcommands, provided for safety)
            const args = (interaction as Message).content.split(' ').slice(1);
            subCommand = args[0] || '';
            if (!subCommand || !['add', 'remove', 'list'].includes(subCommand)) {
                return interaction.reply({ content: 'Invalid syntax. Use `/watch [add|remove|list]`' });
            }
            if (subCommand === 'add' || subCommand === 'remove') {
                const userId = args[1]?.replace(/[<@!>]/g, '');
                if (!userId) return interaction.reply({ content: 'Please provide a valid user ID or tag.' });
                try {
                    targetUser = await client.users.fetch(userId);
                } catch {
                    return interaction.reply({ content: 'User not found.' });
                }
                reason = args.slice(2).join(' ');
            }
        }

        try {
            if (subCommand === 'add') {
                if (!targetUser) return interaction.reply({ content: 'Target user is missing.' });

                // Add to DB
                await client.database.prisma.watchedUser.upsert({
                    where: { guildId_userId: { guildId: interaction.guild.id, userId: targetUser.id } },
                    create: {
                        guildId: interaction.guild.id,
                        userId: targetUser.id,
                        moderatorId: interaction instanceof Message ? interaction.author.id : interaction.user.id,
                        reason: reason || 'Not specified'
                    },
                    update: reason ? { reason } : {}
                });

                const embed = EmbedUtils.success('User Watched', `I am now tracking and logging all activity for **${targetUser.tag}**.`);
                return interaction.reply({ embeds: [embed] });
            }

            else if (subCommand === 'remove') {
                if (!targetUser) return interaction.reply({ content: 'Target user is missing.' });

                try {
                    await client.database.prisma.watchedUser.delete({
                        where: { guildId_userId: { guildId: interaction.guild.id, userId: targetUser.id } }
                    });
                    const embed = EmbedUtils.success('User Unwatched', `I am no longer tracking **${targetUser.tag}**.`);
                    return interaction.reply({ embeds: [embed] });
                } catch {
                    const embed = EmbedUtils.error('Not Watched', `**${targetUser.tag}** is not currently on the watch list.`);
                    return interaction.reply({ embeds: [embed] });
                }
            }

            else if (subCommand === 'list') {
                const watchedUsers = await client.database.prisma.watchedUser.findMany({
                    where: { guildId: interaction.guild.id }
                });

                if (!watchedUsers.length) {
                    const embed = EmbedUtils.info('Watch List', 'There are no users currently being watched in this server.');
                    return interaction.reply({ embeds: [embed] });
                }

                const embed = EmbedUtils.info('👀 Watched Users List',
                    watchedUsers.map(w => `<@${w.userId}> (Added by <@${w.moderatorId}>) - **Reason:** ${w.reason}`).join('\n')
                );
                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('[WatchCommand] Error:', error);
            const embed = EmbedUtils.error('Error', 'An internal database error occurred while managing the watch list.');
            return interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
