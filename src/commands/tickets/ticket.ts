import { Command } from '../../lib/structures/Command';
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    PermissionFlagsBits,
    Message,
    ChatInputCommandInteraction,
    TextChannel,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction,
    CategoryChannel
} from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';

export default {
    name: 'ticket',
    description: 'Ticket system commands.',
    category: 'Tickets',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'setup',
            description: 'Setup the ticket panel.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to send the ticket panel to.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                }
            ]
        },
        {
            name: 'close',
            description: 'Close the current ticket.',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide a subcommand: `setup`, `close`' });
            subcommand = args[0];
            if (!subcommand) return interaction.reply({ content: 'Please provide a subcommand: `setup`, `close`' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
        }

        if (subcommand === 'setup') {
            const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
            if (interaction instanceof Message && !OWNER_IDS.includes(userId) && !interaction.member?.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: 'You need Administrator permissions to setup tickets.' });
            }

            let channel: TextChannel;
            if (interaction instanceof Message) {
                const args = interaction.content.split(' ').slice(1);
                const channelId = args[1]?.replace(/[<#!>]/g, '');
                channel = interaction.guild?.channels.cache.get(channelId!) as TextChannel || interaction.channel as TextChannel;
            } else {
                const chatInteraction = interaction as ChatInputCommandInteraction;
                channel = chatInteraction.options.getChannel('channel', true) as TextChannel;
            }

            if (!channel || !channel.isTextBased()) return interaction.reply({ content: 'Invalid channel.' });

            const embed = EmbedUtils.info(
                'Support Tickets',
                'Click the button below to open a support ticket.\nOur team will be with you shortly.'
            );

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Open Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📩')
                );

            await channel.send({ embeds: [embed], components: [row] });

            // Create a collection usage for button handling if not using a global handler yet
            // For now, we reply success
            const successEmbed = EmbedUtils.success('Ticket System Setup', `Ticket panel sent to ${channel}.`);
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }

        } else if (subcommand === 'close') {
            if (!interaction.channel || !interaction.channel.isTextBased() || interaction.channel.type === ChannelType.DM) return;

            // Check if this channel is a ticket in DB
            const ticket = await client.database.prisma.ticket.findFirst({
                where: { channelId: interaction.channel.id, open: true }
            });

            if (!ticket) {
                return interaction.reply({ content: 'This channel is not a known open ticket.', ephemeral: true });
            }

            await interaction.reply({ content: 'Closing ticket in 5 seconds...' });

            setTimeout(async () => {
                if (interaction.channel) {
                    await client.database.prisma.ticket.update({
                        where: { id: ticket.id },
                        data: { open: false, closedAt: new Date() }
                    });
                    await interaction.channel.delete().catch(() => { });
                }
            }, 5000);
        }
    },
} as Command;
