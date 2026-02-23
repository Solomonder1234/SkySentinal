import { Events, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';
import { EmbedUtils } from '../utils/EmbedUtils';

export default {
    name: Events.InteractionCreate,
    run: async (client, interaction: Interaction) => {
        if (interaction.isCommand()) {
            // Disabled per user request: "I need every command to be ! ONLY"
            // await client.commandHandler.handle(interaction);
            return;
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'application_select') {
                await interaction.deferReply({ flags: ['Ephemeral'] });
                const value = interaction.values[0];
                const type = value === 'apply_pr' ? 'PR' : 'TRIAL_STAFF';

                const result = await client.applicationService.startApplication(interaction.guild, interaction.user, type as any);
                if (result.success) {
                    await interaction.editReply({ content: `✅ Application started! Please proceed to <#${result.channelId}> to begin your interview.` });
                } else {
                    await interaction.editReply({ content: `❌ ${result.message}` });
                }
            } else if (interaction.customId === 'application_select_sub') {
                await interaction.deferReply({ flags: ['Ephemeral'] });
                const value = interaction.values[0];
                let type = '';
                if (value === 'apply_support') type = 'SUPPORT';
                else if (value === 'apply_social') type = 'SOCIAL_MEDIA';
                else if (value === 'apply_creator') type = 'CONTENT_CREATOR';
                else if (value === 'apply_youtube') type = 'YOUTUBE_BROADCAST';
                else if (value === 'apply_weather') type = 'WEATHER_TEAM';

                const result = await client.applicationService.startApplication(interaction.guild, interaction.user, type as any);
                if (result.success) {
                    await interaction.editReply({ content: `✅ Application started! Please proceed to <#${result.channelId}> to begin your interview.` });
                } else {
                    await interaction.editReply({ content: `❌ ${result.message}` });
                }
            } else if (interaction.customId === 'music_filters_select') {
                const guildId = interaction.guildId;
                if (!guildId) return;

                const queue = client.music.getQueue(guildId);
                if (!queue) return interaction.reply({ content: '❌ No active queue.', ephemeral: true });

                await interaction.deferUpdate();

                const selected = interaction.values;
                if (selected.includes('clear')) {
                    queue.filters.clear();
                } else {
                    // Reset filters and then add selected ones
                    queue.filters.clear();
                    for (const filter of selected) {
                        queue.filters.add(filter);
                    }
                }

                await client.music.refreshController(guildId);
                return;
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'app_start_interview' || interaction.customId === 'app_2fa_yes') {
                await interaction.deferUpdate();
                await client.applicationService.sendNextQuestion(interaction.message.channel.id);
            } else if (interaction.customId === 'app_2fa_no') {
                await interaction.reply({ content: 'Application cancelled due to missing 2FA. This channel will be deleted shortly.', components: [] });
                setTimeout(async () => {
                    if (interaction.channel) await interaction.channel.delete().catch(() => null);
                }, 5000);
            } else if (interaction.customId === 'create_ticket') {
                await interaction.deferReply({ flags: ['Ephemeral'] });

                const existingTicket = await client.database.prisma.ticket.findFirst({
                    where: { userId: interaction.user.id, open: true }
                });

                if (existingTicket) {
                    return interaction.editReply({ content: `You already have an open ticket: <#${existingTicket.channelId}>` });
                }

                if (!interaction.guild) return;

                const sanitizedUsername = interaction.user.username.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const channelName = `ticket-${sanitizedUsername}`.substring(0, 100);

                try {
                    const channel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: ['ViewChannel'],
                            },
                            {
                                id: interaction.user.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            },
                            // Add staff role permissions here if configured
                        ],
                    });

                    await client.database.prisma.ticket.create({
                        data: {
                            channelId: channel.id,
                            userId: interaction.user.id,
                            guildId: interaction.guild.id,
                        }
                    });

                    const embed = EmbedUtils.info('Ticket Created', `Welcome ${interaction.user}! Please describe your issue.\nSupport will be with you shortly.`)
                        .setFooter({ text: 'SkySentinel Supreme • Ticket Service' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('close_ticket')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🔒')
                        );

                    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
                    await interaction.editReply({ content: `Ticket created: ${channel}` });
                } catch (error) {
                    console.error('Error creating ticket:', error);
                    await interaction.editReply({ content: 'Failed to create ticket channel. Please contact an admin.' });
                }

            } else if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
                setTimeout(async () => {
                    if (interaction.channel) {
                        const ticket = await client.database.prisma.ticket.findFirst({
                            where: { channelId: interaction.channel.id, open: true }
                        });
                        if (ticket) {
                            await client.database.prisma.ticket.update({
                                where: { id: ticket.id },
                                data: { open: false, closedAt: new Date() }
                            });
                        }
                        await interaction.channel.delete().catch(() => { });
                    }
                }, 5000);
            } else if (interaction.customId.startsWith('staff_app_')) {
                const parts = interaction.customId.split('_');
                const action = parts[2]; // approve, deny, view
                const appId = parseInt(parts[3] || '0');

                if (!appId) return interaction.reply({ content: 'Invalid Application ID.', flags: ['Ephemeral'] });

                // Permission Check: Co-founder+
                const member = interaction.member as any;
                const isOwner = interaction.guild?.ownerId === interaction.user.id;
                const isAdmin = member.permissions.has('Administrator');
                const hasRole = member.roles.cache.some((r: any) =>
                    ['founder', 'co-founder', 'head of staff', 'hos', 'senior admin', 'sr. admin'].includes(r.name.toLowerCase())
                );

                if (!isOwner && !isAdmin && !hasRole) {
                    return interaction.reply({ content: '❌ Only Co-founder+ staff can review applications.', flags: ['Ephemeral'] });
                }

                if (action === 'view') {
                    await interaction.deferReply({ flags: ['Ephemeral'] });
                    const file = await client.applicationService.getTranscriptFile(appId);
                    if (!file) return interaction.editReply({ content: '❌ Transcript not found.' });
                    await interaction.editReply({ files: [file] });
                } else if (action === 'approve' || action === 'deny') {
                    await interaction.deferUpdate();
                    const decision = action === 'approve' ? 'ACCEPTED' : 'DENIED';
                    const result = await client.applicationService.processStaffDecision(appId, interaction.user.id, decision, interaction.guild);

                    if (result.success) {
                        const originalEmbed = interaction.message.embeds[0];
                        if (!originalEmbed) return;

                        const embed = EmbedBuilder.from(originalEmbed);
                        embed.setTitle(`Application ${decision === 'ACCEPTED' ? 'Approved' : 'Denied'}`);
                        embed.addFields({ name: 'Reviewed By', value: `<@${interaction.user.id}>` });
                        embed.setColor(decision === 'ACCEPTED' ? '#00ff00' : '#ff0000');

                        await interaction.message.edit({ embeds: [embed], components: [] });
                    } else {
                        await interaction.followUp({ content: `❌ ${result.message}`, flags: ['Ephemeral'] });
                    }
                }
            } else if (interaction.customId.startsWith('verify_user_')) {
                const parts = interaction.customId.split('_');
                const roleId = parts[2];
                if (!roleId) return interaction.reply({ content: 'Invalid verification button.', ephemeral: true });

                const role = interaction.guild?.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: 'Verification role not found found. Please contact an administrator.', ephemeral: true });
                }

                const member = interaction.member as any; // GuildMember cast
                if (member.roles.cache.has(roleId)) {
                    return interaction.reply({ content: 'You are already verified!', ephemeral: true });
                }

                try {
                    await member.roles.add(role);
                    await interaction.reply({ content: `✅ Verified! You have been given the **${role.name}** role.`, ephemeral: true });

                    // Log it
                    await Logger.log(
                        interaction.guild!,
                        'Member Verified',
                        `${interaction.user} has verified.`,
                        'Green'
                    );

                } catch (error) {
                    await interaction.reply({ content: 'Failed to assign role. Check my permissions.', ephemeral: true });
                }
            } else if (interaction.customId.startsWith('music_')) {
                // Music Controller Interaction
                const guildId = interaction.guildId;
                if (!guildId) return;

                const member = interaction.member as any;
                if (!member.voice.channel) {
                    return interaction.reply({ content: '❌ You must be in a voice channel to control music!', ephemeral: true });
                }

                await interaction.deferUpdate();

                try {
                    const action = interaction.customId.replace('music_', '');
                    const queue = client.music.getQueue(guildId);

                    if (!queue) {
                        return interaction.followUp({ content: '❌ No active music queue found.', ephemeral: true });
                    }

                    switch (action) {
                        case 'shuffle':
                            client.music.distube.shuffle(guildId);
                            break;
                        case 'previous':
                            await client.music.distube.previous(guildId).catch(() => { });
                            break;
                        case 'pause':
                            if (queue.paused) queue.resume();
                            else queue.pause();
                            break;
                        case 'skip':
                            await client.music.skip(guildId);
                            break;
                        case 'stop':
                            client.music.stop(guildId);
                            break;
                        case 'loop':
                            const mode = (queue.repeatMode + 1) % 3;
                            client.music.distube.setRepeatMode(guildId, mode);
                            break;
                        case 'vol_down':
                            client.music.distube.setVolume(guildId, Math.max(0, queue.volume - 10));
                            break;
                        case 'vol_up':
                            client.music.distube.setVolume(guildId, Math.min(100, queue.volume + 10));
                            break;
                        case 'refresh':
                            // Just refresh the UI below
                            break;
                    }

                    // Refresh the controller UI
                    await client.music.refreshController(guildId);
                } catch (error: any) {
                    client.logger.error(`[MusicController] Interaction Error:`, error);
                }
            }
        }
    },
} as Event<Events.InteractionCreate>;
