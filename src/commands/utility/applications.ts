import { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'applications',
    description: 'Master control switch for the server application system.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'silent',
            description: 'Open applications silently without pinging @everyone.',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        },
        {
            name: 'announce_close',
            description: 'Broadcast a warning that applications are closing soon.',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    run: async (client, interaction) => {
        if (!(interaction instanceof Message)) await interaction.deferReply({ flags: ['Ephemeral'] });

        let silent = false;
        let isCloseAnnounce = false;
        let panelId = 1;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args.includes('silent')) silent = true;
            if (args.includes('close')) isCloseAnnounce = true;
            if (args.includes('2')) panelId = 2;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            silent = chatInteraction.options.getBoolean('silent') ?? false;
            isCloseAnnounce = chatInteraction.options.getBoolean('announce_close') ?? false;
        }

        const isTransit = panelId === 2 || interaction.guild?.id === '1466918766490292480';
        const announceChannelId = isTransit ? '1469979181835358290' : '1276237463823581275';

        if (isCloseAnnounce) {
            try {
                const annChannel = await interaction.guild?.channels.fetch(announceChannelId);
                if (annChannel && annChannel.isTextBased()) {
                    await annChannel.send({
                        content: '@everyone',
                        embeds: [EmbedUtils.warning('⚠️ Applications Closing Soon!', 'This is an official notice that **Staff Applications will be closing in a few days!**\n\nIf you have not yet submitted your application or completed your interview, please make sure to finalize it as soon as possible. Once applications are formally closed, all active interview channels will be locked. Good luck!')]
                    });
                    const replyOptions = { content: '✅ Closure warning announcement successfully broadcasted to the applications channel.' };
                    if (interaction instanceof Message) {
                        return interaction.reply(replyOptions);
                    } else {
                        return interaction.editReply(replyOptions);
                    }
                }
            } catch (e) {
                client.logger.error('Failed to send closing announcement.', e);
            }
            return;
        }

        let settings = await client.database.prisma.applicationSettings.findUnique({
            where: { guildId: interaction.guildId! }
        });

        if (!settings) {
            settings = await client.database.prisma.applicationSettings.create({
                data: { guildId: interaction.guildId!, isOpen: false }
            });
        }

        const newState = !settings.isOpen;

        // Update DB
        const updatedSettings = await client.database.prisma.applicationSettings.update({
            where: { guildId: interaction.guildId! },
            data: {
                isOpen: newState,
                openedAt: newState ? new Date() : null,
                applicationCount: 0 // Reset counter
            }
        });

        const replyOptions = {
            embeds: [EmbedUtils[newState ? 'success' : 'error'](
                'Application System Update',
                `The server application system is now **${newState ? 'OPEN' : 'CLOSED'}**.`
            )]
        };

        if (interaction instanceof Message) {
            await interaction.reply(replyOptions);
        } else {
            await interaction.editReply(replyOptions);
        }

        // Announce
        try {
            const annChannel = await interaction.guild?.channels.fetch(announceChannelId);
            if (annChannel && annChannel.isTextBased()) {
                if (newState) {
                    let embed, selectMenu;

                    if (isTransit) {
                        embed = EmbedUtils.premium(
                            'Transit Server Operations Applications',
                            'We are actively recruiting for our specialized Transit Operations teams! If you possess the required skills, select an option below.\n\n**⚠️ INSTRUCTIONS**\nOnce you open an application channel, you will have **30 minutes** to complete the interview. You can cancel your interview at any time by typing `!cancelapp` in the channel.\n\n**Available Positions:**\n- **Public Relations Associate (PRA):** Manage community relations and partnered events.\n- **People & Culture Associate (P&C-A):** Handle internal staff relations and morale.\n- **Operations Associate (OA):** Manage daily on-the-ground transit operations.\n- **Transit Supervisor (TSV):** Supervise active routes and assist the operations team.\n- **Transit Manager (TM):** High-level administration of the entire transit network.'
                        );

                        selectMenu = new StringSelectMenuBuilder()
                            .setCustomId('application_select_transit')
                            .setPlaceholder('Select a Transit Position...')
                            .addOptions(
                                new StringSelectMenuOptionBuilder().setLabel('Public Relations Associate').setDescription('Apply for PRA').setValue('apply_transit_pra').setEmoji('🤝'),
                                new StringSelectMenuOptionBuilder().setLabel('People & Culture Associate').setDescription('Apply for P&C-A').setValue('apply_transit_pca').setEmoji('🫂'),
                                new StringSelectMenuOptionBuilder().setLabel('Operations Associate').setDescription('Apply for OA').setValue('apply_transit_oa').setEmoji('🚌'),
                                new StringSelectMenuOptionBuilder().setLabel('Transit Supervisor').setDescription('Apply for TSV').setValue('apply_transit_tsv').setEmoji('📋'),
                                new StringSelectMenuOptionBuilder().setLabel('Transit Manager').setDescription('Apply for TM').setValue('apply_transit_tm').setEmoji('🏢')
                            );
                    } else {
                        embed = EmbedUtils.info(
                            'SkyAlert Network Applications OPEN!',
                            'We are currently looking for dedicated individuals to join our team! Please use the dropdown menu below to select the position you wish to apply for.\n\n**Available Positions:**\n- **Public Relations (PR):** Community engagement, support, and diplomacy.\n- **Trial Staff:** Moderation, rule enforcement, and server security.\n\n*Note: Selecting an option will open a private interview channel where our automated system will guide you through the application process. You will have **30 minutes** to complete the application once opened.*'
                        );

                        selectMenu = new StringSelectMenuBuilder()
                            .setCustomId('application_select')
                            .setPlaceholder('Select a position to apply for...')
                            .addOptions(
                                new StringSelectMenuOptionBuilder().setLabel('Public Relations').setDescription('Apply to join the PR Team').setValue('apply_pr').setEmoji('🤝'),
                                new StringSelectMenuOptionBuilder().setLabel('Trial Staff').setDescription('Apply to join the Moderation Team').setValue('apply_trial_staff').setEmoji('🛡️')
                            );
                    }

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

                    const msgContent = silent ? 'Applications are now open!' : '@everyone';
                    const msg = await annChannel.send({ content: msgContent, embeds: [embed], components: [row] });

                    // Save message ID to delete it later
                    await client.database.prisma.applicationSettings.update({
                        where: { guildId: interaction.guildId! },
                        data: { dropdownMessageId: msg.id, dropdownChannelId: annChannel.id }
                    });

                } else {
                    await annChannel.send({ embeds: [EmbedUtils.error('Applications Closed', 'Server staff applications are now officially closed. Thank you to everyone who applied!')] });

                    // Cleanup old message
                    if (updatedSettings.dropdownMessageId && updatedSettings.dropdownChannelId) {
                        try {
                            const dropChannel = await interaction.guild?.channels.fetch(updatedSettings.dropdownChannelId);
                            if (dropChannel && dropChannel.isTextBased()) {
                                const dropMsg = await dropChannel.messages.fetch(updatedSettings.dropdownMessageId);
                                if (dropMsg) await dropMsg.delete();
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) {
            client.logger.warn('Failed to send application announcement.', e);
        }
    }
} as Command;
