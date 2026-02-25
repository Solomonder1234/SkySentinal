import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'setticketcategory',
    description: 'Sets the category where new user support tickets will be created.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
        {
            name: 'category',
            description: 'The category channel for tickets.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channelTypes: [4] // Category channel type
        }
    ],
    run: async (client: any, interaction: any) => {
        let hasPerms = false;
        if (interaction instanceof Message) {
            hasPerms = interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild) || false;
        } else {
            hasPerms = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || false;
        }

        if (!hasPerms) {
            const err = EmbedUtils.error('Access Denied', 'You need `Manage Server` permissions to configure this.');
            return interaction.reply(interaction instanceof Message ? { embeds: [err] } : { embeds: [err], ephemeral: true });
        }

        let categoryId = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            categoryId = args[0] || '';
            if (!categoryId) {
                return interaction.reply({ content: 'Please provide a valid Category ID. Example: `!setticketcategory 1234567890`' });
            }
            const channel = interaction.guild?.channels.cache.get(categoryId);
            if (!channel || channel.type !== 4) { // 4 is Category
                return interaction.reply({ content: 'Invalid Category ID provided. Make sure to provide the ID of a Category folder.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            categoryId = chatInteraction.options.getChannel('category', true).id;
        }

        const guildId = interaction.guildId!;

        try {
            JSONDatabase.updateGuildConfig(guildId, { ticketCategoryId: categoryId });

            const embed = EmbedUtils.success('Configuration Saved', `The default ticket category has been successfully mapped to <#${categoryId}>.`);
            return interaction.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Failed to set ticket category:', err);
            return interaction.reply({ embeds: [EmbedUtils.error('Database Error', 'Could not save the configuration to the mainframe.')] });
        }
    }
} as Command;
