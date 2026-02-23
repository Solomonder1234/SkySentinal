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
        }
    ],
    run: async (client, interaction) => {
        if (!(interaction instanceof Message)) await interaction.deferReply({ flags: ['Ephemeral'] });

        let silent = false;
        if (!(interaction instanceof Message)) {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            silent = chatInteraction.options.getBoolean('silent') ?? false;
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
        const announceChannelId = '1276237463823581275';
        try {
            const annChannel = await interaction.guild?.channels.fetch(announceChannelId);
            if (annChannel && annChannel.isTextBased()) {
                if (newState) {
                    const embed = EmbedUtils.info(
                        'SkyAlert Network Applications OPEN!',
                        'We are currently looking for dedicated individuals to join our team! Please use the dropdown menu below to select the position you wish to apply for.\n\n**Available Positions:**\n- **Public Relations (PR):** Community engagement, support, and diplomacy.\n- **Trial Staff:** Moderation, rule enforcement, and server security.\n\n*Note: Selecting an option will open a private interview channel where our automated system will guide you through the application process. You will have **30 minutes** to complete the application once opened.*'
                    );

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('application_select')
                        .setPlaceholder('Select a position to apply for...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('Public Relations').setDescription('Apply to join the PR Team').setValue('apply_pr').setEmoji('🤝'),
                            new StringSelectMenuOptionBuilder().setLabel('Trial Staff').setDescription('Apply to join the Moderation Team').setValue('apply_trial_staff').setEmoji('🛡️')
                        );

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
