import { Events, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, GuildMember, AttachmentBuilder, TextChannel, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { PromotionService } from '../lib/services/PromotionService';
import { JSONDatabase } from '../utils/JSONDatabase';
import { Logger } from '../utils/Logger';
import { EmbedUtils } from '../utils/EmbedUtils';

export default {
    name: Events.InteractionCreate,
    run: async (client: any, interaction: Interaction) => {
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
            } else if (interaction.customId === 'application_select_transit') {
                await interaction.deferReply({ flags: ['Ephemeral'] });
                const value = interaction.values[0];
                let type = '';
                if (value === 'apply_transit_pra') type = 'TRANSIT_PRA';
                else if (value === 'apply_transit_pca') type = 'TRANSIT_PCA';
                else if (value === 'apply_transit_oa') type = 'TRANSIT_OA';
                else if (value === 'apply_transit_tsv') type = 'TRANSIT_TSV';
                else if (value === 'apply_transit_tm') type = 'TRANSIT_TM';

                const result = await client.applicationService.startApplication(interaction.guild, interaction.user, type as any);
                if (result.success) {
                    await interaction.editReply({ content: `✅ Application started! Please proceed to <#${result.channelId}> to begin your interview.` });
                } else {
                    await interaction.editReply({ content: `❌ ${result.message}` });
                }
            } else if (interaction.customId === 'ticket_select') {
                await interaction.deferReply({ flags: ['Ephemeral'] });
                const value = interaction.values[0];

                const existingTicket = await client.database.prisma.ticket.findFirst({
                    where: { userId: interaction.user.id, open: true }
                });

                if (existingTicket) {
                    return interaction.editReply({ content: `You already have an open ticket: <#${existingTicket.channelId}>` });
                }

                if (!interaction.guild) return;

                const guildConf = await client.database.prisma.guildConfig.findUnique({ where: { id: interaction.guild.id } });
                const jsonConf = JSONDatabase.getGuildConfig(interaction.guild.id);
                const categoryRaw = guildConf?.ticketCategoryId || jsonConf.ticketCategoryId || '1470069914382503978';

                const sanitizedUsername = interaction.user.username.replace(/[^a-z0-9]/gi, '').toLowerCase();
                let channelName = `ticket-${sanitizedUsername}`.substring(0, 100);

                let prettyType = 'General Support';
                if (value === 'ticket_report') prettyType = 'Member Report';
                if (value === 'ticket_hr') { prettyType = 'HR/Admin Request'; channelName = `hr-${sanitizedUsername}`.substring(0, 100); }
                if (value === 'ticket_investigation') { prettyType = 'Investigation'; channelName = `inv-${sanitizedUsername}`.substring(0, 100); }

                try {
                    const channel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: categoryRaw || null,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                            { id: client.user.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] }
                        ]
                    });

                    await client.database.prisma.ticket.create({
                        data: {
                            channelId: channel.id,
                            userId: interaction.user.id,
                            guildId: interaction.guild.id,
                        }
                    });

                    const embed = EmbedUtils.info(`${prettyType}`, `Welcome ${interaction.user}!\n\nPlease describe your issue or report in detail.\nOur team will be with you shortly.`)
                        .setFooter({ text: 'SkySentinel AV • Ticket Service' });

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                    );

                    await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row as any] });
                    await interaction.editReply({ content: `Ticket created: ${channel}` });
                } catch (error) {
                    client.logger.error('Error creating ticket:', error);
                    await interaction.editReply({ content: 'Failed to create ticket channel. Please contact an admin.' });
                }
            } else if (interaction.customId === 'music_filters_select') {
                const guildId = interaction.guildId;
                if (!guildId) return;

                const queue = client.music.getQueue(guildId);
                if (!queue) return interaction.reply({ content: '❌ No active queue.', ephemeral: true });

                await interaction.deferUpdate();

                const selected = interaction.values[0];
                if (selected === 'clear') {
                    queue.filters.clear();
                } else {
                    queue.filters.add(selected as any);
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

                const guildConf = await client.database.prisma.guildConfig.findUnique({ where: { id: interaction.guild.id } });
                const jsonConf = JSONDatabase.getGuildConfig(interaction.guild.id);
                const categoryRaw = guildConf?.ticketCategoryId || jsonConf.ticketCategoryId || '1470069914382503978';

                const sanitizedUsername = interaction.user.username.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const channelName = `ticket-${sanitizedUsername}`.substring(0, 100);

                try {
                    const channel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: categoryRaw || null,
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
                        .setFooter({ text: 'SkySentinel AV • Ticket Service' });

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
                    if (interaction.channel && interaction.channel.isTextBased()) {
                        const ticket = await client.database.prisma.ticket.findFirst({
                            where: { channelId: interaction.channel.id, open: true }
                        });

                        try {
                            const messages = await interaction.channel.messages.fetch({ limit: 100 });
                            const transcriptData = messages.reverse().map((m: any) => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
                            const buffer = Buffer.from(transcriptData, 'utf-8');
                            const attach = new AttachmentBuilder(buffer, { name: `transcript-${(interaction.channel as any).name || 'ticket'}.txt` });

                            const tChannel = await client.channels.fetch('1470074406134087691').catch(() => null);
                            if (tChannel && tChannel.isTextBased()) {
                                await (tChannel as TextChannel).send({
                                    content: `Transcript for closed ticket \`#${(interaction.channel as any).name || 'ticket'}\``,
                                    files: [attach]
                                });
                            }
                        } catch (e) {
                            client.logger.error('Failed to send transcript:', e);
                        }

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

                const member = interaction.member as GuildMember;
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
                            queue.shuffle();
                            break;
                        case 'previous':
                            await queue.previous().catch(() => { });
                            break;
                        case 'pause':
                            if (queue.paused) queue.resume();
                            else queue.pause();
                            break;
                        case 'skip':
                            await queue.skip().catch(() => { });
                            break;
                        case 'stop':
                            queue.stop();
                            break;
                        case 'loop':
                            const newMode = (queue.repeatMode + 1) % 3;
                            queue.setRepeatMode(newMode);
                            break;
                        case 'vol_down':
                            queue.setVolume(Math.max(0, queue.volume - 10));
                            break;
                        case 'vol_up':
                            queue.setVolume(Math.min(100, queue.volume + 10));
                            break;
                    }

                    // Refresh the controller UI
                    await client.music.refreshController(guildId);
                } catch (error: any) {
                    client.logger.error(`[MusicController] Interaction Error:`, error);
                }
            } else if (interaction.customId.startsWith('suggest_')) {
                const parts = interaction.customId.split('_');
                const action = parts[1]; // accept, deny, close
                const suggestionId = parseInt(parts[parts.length - 1] as string);

                if (!suggestionId) return interaction.reply({ content: 'Invalid Suggestion ID.', flags: ['Ephemeral'] });

                // Permission Check: ManageChannels or Staff Roles
                const member = interaction.member as GuildMember;
                const isAdmin = member.permissions.has('ManageChannels');
                const hasStaffRole = member.roles.cache.some((r: any) =>
                    ['founder', 'co-founder', 'head of staff', 'hos', 'senior admin', 'sr. admin', 'moderator', 'sr. moderator', 'admin', 'staff'].some(role => r.name.toLowerCase().includes(role))
                );

                if (!isAdmin && !hasStaffRole) {
                    return interaction.reply({ content: '❌ Only staff members can review suggestions.', flags: ['Ephemeral'] });
                }

                try {
                    await interaction.deferUpdate();
                } catch (e) {
                    return interaction.reply({ content: '❌ Interaction expired. Please try again.', flags: ['Ephemeral'] }).catch(() => { });
                }

                const decision = action === 'accept' ? 'ACCEPTED' : (action === 'deny' ? 'DENIED' : 'CLOSED');
                const result = await client.suggestions.processDecision(suggestionId, member, decision as any);

                if (result.success) {
                    if (decision !== 'CLOSED') {
                        const originalEmbed = interaction.message.embeds[0];
                        if (originalEmbed) {
                            const embed = EmbedBuilder.from(originalEmbed);
                            embed.setColor(decision === 'ACCEPTED' ? '#00ff00' : '#ff0000');
                            embed.addFields({ name: 'Decision', value: `${decision} by <@${interaction.user.id}>` });
                            await interaction.message.edit({ embeds: [embed], components: [] });
                        }
                    }
                } else {
                    await interaction.followUp({ content: `❌ ${result.message}`, flags: ['Ephemeral'] });
                }
            } else if (interaction.customId.startsWith('appeal_btn_start')) {
                const parts = interaction.customId.split('_');
                const guildIdStr = parts[3] || interaction.guild?.id;

                if (!guildIdStr) return interaction.reply({ content: 'Cannot determine server origin. You may need to ask an administrator directly.', ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId(`modal_appeal_${guildIdStr}`)
                    .setTitle('Formal Infraction Appeal');

                const actionInput = new TextInputBuilder()
                    .setCustomId('appeal_action')
                    .setLabel('What action are you appealing?')
                    .setPlaceholder('Ban, Kick, Warn, or Timeout.')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(50)
                    .setRequired(true);

                const staffInput = new TextInputBuilder()
                    .setCustomId('appeal_staff')
                    .setLabel('Staff Member Involved')
                    .setPlaceholder('Username or ID (Leave blank if unknown)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(false);

                const dateInput = new TextInputBuilder()
                    .setCustomId('appeal_date')
                    .setLabel('Approximate Date of Incident')
                    .setPlaceholder('e.g., Yesterday, May 4th, 2024')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const reasonInput = new TextInputBuilder()
                    .setCustomId('appeal_reason')
                    .setLabel('Why should this be reversed?')
                    .setPlaceholder('State your case clearly...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);

                const proofInput = new TextInputBuilder()
                    .setCustomId('appeal_proof')
                    .setLabel('Additional Proof / Links')
                    .setPlaceholder('Any images or evidence? (Optional)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(staffInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(proofInput)
                );

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('modal_appeal_')) {
                await interaction.deferReply({ flags: ['Ephemeral'] as any });
                const guildIdStr = interaction.customId.split('_')[2];
                const guild = client.guilds.cache.get(guildIdStr);

                if (!guild) return interaction.editReply({ content: 'Server not found or bot is no longer in this server.' });

                const actionMsg = interaction.fields.getTextInputValue('appeal_action');
                const staffMsg = interaction.fields.getTextInputValue('appeal_staff') || 'Unknown/Not Provided';
                const dateMsg = interaction.fields.getTextInputValue('appeal_date');
                const reasonMsg = interaction.fields.getTextInputValue('appeal_reason');
                const proofMsg = interaction.fields.getTextInputValue('appeal_proof') || 'None provided';

                let modmailCategory = guild.channels.cache.find((c: any) => c.name === 'Modmail' && c.type === ChannelType.GuildCategory);
                const targetChannelName = `mm-${interaction.user.id}`;
                let targetChannel = guild.channels.cache.find((c: any) => c.name === targetChannelName && c.parentId === modmailCategory?.id) as any;

                if (!targetChannel) {
                    const overwrites: any[] = [
                        { id: guild.id, deny: ['ViewChannel'] as any },
                        { id: client.user!.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] as any }
                    ];

                    const guildConf = await client.database.prisma.guildConfig.findUnique({ where: { id: guild.id } });
                    if (guildConf?.modRoleId) overwrites.push({ id: guildConf.modRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
                    if (guildConf?.adminRoleId) overwrites.push({ id: guildConf.adminRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });

                    if (!modmailCategory) {
                        try {
                            modmailCategory = await guild.channels.create({
                                name: 'Modmail',
                                type: ChannelType.GuildCategory,
                                permissionOverwrites: overwrites
                            });
                        } catch (e) {
                            // Ignore if we can't create category
                        }
                    }

                    try {
                        targetChannel = await guild.channels.create({
                            name: targetChannelName,
                            type: ChannelType.GuildText,
                            topic: `Modmail / Appeal for ${interaction.user.tag} (${interaction.user.id})`,
                            parent: modmailCategory?.id || null,
                            permissionOverwrites: overwrites
                        });
                    } catch (e) {
                        return interaction.editReply({ content: 'Failed to securely transmit your appeal. Staff may have locked down the system.' });
                    }
                }

                const appealEmbed = EmbedUtils.premium(
                    'Formal Infraction Appeal',
                    `**User:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n**Action Appealed:** ${actionMsg}\n**Date of Incident:** ${dateMsg}\n**Issuing Staff Member:** ${staffMsg}\n\n**Reason / Statement:**\n${reasonMsg}\n\n**Additional Proof/Context:**\n${proofMsg}`
                ).setColor(0xffaa00).setTimestamp();

                await targetChannel.send({ embeds: [appealEmbed] });
                await interaction.editReply({ content: '✅ Your appeal has been securely transmitted to the Senior Enforcement Branch!' });
            }
        }
    },
} as Event<Events.InteractionCreate>;
