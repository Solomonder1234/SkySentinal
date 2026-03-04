import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, Message, ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'applysetup',
    description: 'Set up application panels for specific sub-teams.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'panel',
            description: 'The panel ID to deploy (e.g., 1 for Sub-Teams).',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        // Enforce Admin/Founder only
        const member = interaction.member as any;
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        const isOwner = interaction.guild?.ownerId === user.id || user.id === '753372101540577431';
        const isGlobalAdmin = user.id === '753372101540577431';
        const isAdmin = member?.permissions?.has('Administrator');

        let hasRole = false;
        if (member?.roles?.cache) {
            hasRole = member.roles.cache.some((r: any) =>
                ['founder', 'co-founder', 'head of staff', 'hos', 'senior admin', 'sr. admin'].includes(r.name.toLowerCase())
            );
        }

        if (!isOwner && !isAdmin && !hasRole && !isGlobalAdmin) {
            const errorOptions = { embeds: [EmbedUtils.error('Access Denied', 'You do not have permission to deploy application panels.')], ephemeral: true };
            return interaction instanceof Message ? interaction.reply(errorOptions) : (interaction as ChatInputCommandInteraction).reply(errorOptions);
        }

        let panelId = 1;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args[0]) panelId = parseInt(args[0]);
        } else {
            panelId = (interaction as ChatInputCommandInteraction).options.getInteger('panel', true);
        }

        if (panelId === 1) {
            const embed = EmbedUtils.premium(
                'SkyAlert Network Sub-Team Applications',
                'We are actively recruiting for our specialized sub-teams! If you possess specific skills and want to contribute to the network, select an option below.\n\n**⚠️ MANDATORY REQUIREMENT: 2FA**\nAll positions require **Two-Factor Authentication (2FA)** to be enabled on your Discord account. You will be required to confirm this before applying.\n\n**⏳ TIME LIMIT**\nOnce you open an application channel, you will have **30 minutes** to complete the application.\n\n**Available Positions:**\n- **Support Team:** Assist users with inquiries and technical issues.\n- **Social Media Team:** Manage and grow our social presence.\n- **Content Creator:** Produce engaging content for the community.\n- **YouTube Broadcast Team:** Moderate and manage live broadcasts.\n- **Weather Team:** Specialized meteorological analysis and alerts.'
            );

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('application_select_sub')
                .setPlaceholder('Select a specialized position...')
                .addOptions(
                    { label: 'Support Team', description: 'Apply for the Support Team', value: 'apply_support', emoji: '🎫' },
                    { label: 'Social Media Team', description: 'Apply for the Social Media Team', value: 'apply_social', emoji: '📱' },
                    { label: 'Content Creator', description: 'Apply as a Content Creator', value: 'apply_creator', emoji: '🎥' },
                    { label: 'YouTube Broadcast Team', description: 'Apply for the YouTube Broadcast Team', value: 'apply_youtube', emoji: '▶️' },
                    { label: 'Weather Team', description: 'Apply for the Weather Team / Meteorologist', value: 'apply_weather', emoji: '🌪️' }
                );

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            if (interaction instanceof Message) {
                if (interaction.channel && interaction.channel.isTextBased()) {
                    await (interaction.channel as any).send({ embeds: [embed], components: [row] });
                }
                await interaction.reply({ content: 'Panel deployed.', flags: ['Ephemeral'] as any }).catch(() => null);
            } else {
                await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed], components: [row] });
            }
        } else if (panelId === 2) {
            const embed = EmbedUtils.premium(
                'Transit Server Operations Applications',
                'We are actively recruiting for our specialized Transit Operations teams! If you possess the required skills, select an option below.\n\n**⚠️ INSTRUCTIONS**\nOnce you open an application channel, you will have **30 minutes** to complete the interview. You can cancel your interview at any time by typing `!cancelapp` in the channel.\n\n**Available Positions:**\n- **Public Relations Associate (PRA):** Manage community relations and partnered events.\n- **People & Culture Associate (P&C-A):** Handle internal staff relations and morale.\n- **Operations Associate (OA):** Manage daily on-the-ground transit operations.\n- **Transit Supervisor (TSV):** Supervise active routes and assist the operations team.\n- **Transit Manager (TM):** High-level administration of the entire transit network.'
            );

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('application_select_transit')
                .setPlaceholder('Select a Transit Position...')
                .addOptions(
                    { label: 'Public Relations Associate', description: 'Apply for PRA', value: 'apply_transit_pra', emoji: '🤝' },
                    { label: 'People & Culture Associate', description: 'Apply for P&C-A', value: 'apply_transit_pca', emoji: '🫂' },
                    { label: 'Operations Associate', description: 'Apply for OA', value: 'apply_transit_oa', emoji: '🚌' },
                    { label: 'Transit Supervisor', description: 'Apply for TSV', value: 'apply_transit_tsv', emoji: '📋' },
                    { label: 'Transit Manager', description: 'Apply for TM', value: 'apply_transit_tm', emoji: '🏢' }
                );

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            if (interaction instanceof Message) {
                if (interaction.channel && interaction.channel.isTextBased()) {
                    await (interaction.channel as any).send({ embeds: [embed], components: [row] });
                }
                await interaction.reply({ content: 'Transit Panel deployed.', flags: ['Ephemeral'] as any }).catch(() => null);
            } else {
                await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed], components: [row] });
            }
        } else {
            const replyOptions = { content: 'Unknown panel ID. Try `1` or `2`.', ephemeral: true };
            return interaction instanceof Message ? interaction.reply(replyOptions) : (interaction as ChatInputCommandInteraction).reply(replyOptions);
        }
    },
} as Command;
