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
            const subteamGifs = [
                'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', // High-tech work
                'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', // Analytics/Screens
                'https://media.giphy.com/media/ule4vhQigQB20/giphy.gif'  // Cyber/Network pulse
            ];
            const selectedGif = subteamGifs[Math.floor(Math.random() * subteamGifs.length)];

            const embed = EmbedUtils.premium(
                'Sub-Team Recruitment Portal',
                'We are actively recruiting for specialized sub-teams! If you possess specific skills and want to contribute to the network, select an option below.\n\n**REQUIREMENTS**\n🔐 **2FA Authentication** is mandatory.\n⏳ You will have **30 minutes** to complete the interview once started.\n\n**AVAILABLE POSITIONS**\n- **Support Team:** Assist users with inquiries and technical issues.\n- **Social Media Team:** Manage and grow our social presence.\n- **Content Creator:** Produce engaging content for the community.\n- **YouTube Broadcast Team:** Moderate and manage live broadcasts.\n- **Weather Team:** Specialized meteorological analysis and alerts.'
            ).setImage(selectedGif || null);

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
            const transitGifs = [
                'https://media.giphy.com/media/3o7aD2saal6q1858z6/giphy.gif', // Subways/Movement
                'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',  // Night city streak
                'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif'     // City grids/transit maps
            ];
            const selectedTransitGif = transitGifs[Math.floor(Math.random() * transitGifs.length)];

            const embed = EmbedUtils.premium(
                'Transit Server Operations Hub',
                'Join the active Operations network. Ensure you have verified your Roblox account before submitting an application.\n\n**REQUIREMENTS**\n🔐 **2FA Authentication** is mandatory.\n⏳ You will have **30 minutes** to complete the interview once started.\n\n**AVAILABLE POSITIONS**\n- **Transit Supervisor (TSV):** Supervise active routes and assist the operations team.\n- **Transit Moderation (TM):** Enforce server rules and maintain safety on active flights/routes.'
            ).setImage(selectedTransitGif || null);

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
