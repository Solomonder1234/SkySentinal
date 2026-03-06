import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'ticketsetup',
    description: 'Deploys the SkySentinel advanced Ticket Panel dropdown.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const member = interaction.member as any;
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        const isAdmin = member?.permissions?.has('Administrator');
        const isGlobalAdmin = user.id === '753372101540577431';

        if (!isAdmin && interaction.guild?.ownerId !== member.id && !isGlobalAdmin) {
            return interaction.reply({ content: 'Only Administrators can use this command.', ephemeral: true });
        }

        const ticketGifs = [
            'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif', // Network nodes/Data
            'https://media.giphy.com/media/26tn33aiTi1jIGsnu/giphy.gif', // Cyber Terminal
            'https://media.giphy.com/media/l41YcGT5ShJa0nCM0/giphy.gif' // High tech analysis
        ];
        const selectedGif = ticketGifs[Math.floor(Math.random() * ticketGifs.length)];

        const embed = EmbedUtils.premium(
            'SkySentinel Support Terminal',
            'Select the corresponding category below to open a direct, private communication channel with the staff network.\n\n**CATEGORIES**\n❓ **Support Request:** General inquiries and assistance.\n⚠️ **Member Report:** Privately report users breaking protocol.\n👔 **HR/Admin:** Highly-sensitive network issues.\n🕵️ **Investigations:** Dedicated intelligence reports.'
        ).setImage(selectedGif || null);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Make a selection')
            .addOptions(
                { label: 'Questions/Support', description: 'General Support and Questions.', value: 'ticket_support', emoji: '❓' },
                { label: 'Reporting a Member', description: 'Reporting a non-staff member for behavior in our server.', value: 'ticket_report', emoji: '⚠️' },
                { label: 'HR/Admin Only', description: 'Report a Staff member or other Sensitive information that only higher up staff should see', value: 'ticket_hr', emoji: '👔' },
                { label: 'Investigations', description: 'Report conqusters, surfers, illegal activities.', value: 'ticket_investigation', emoji: '🕵️' }
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        if (interaction instanceof Message) {
            if (interaction.channel && interaction.channel.isTextBased()) {
                await (interaction.channel as any).send({ embeds: [embed], components: [row] });
            }
            await interaction.reply({ content: 'Ticket panel deployed.', flags: ['Ephemeral'] as any }).catch(() => null);
        } else {
            const replyInteraction = interaction as ChatInputCommandInteraction;
            await (replyInteraction.channel as TextChannel)?.send({ embeds: [embed], components: [row as any] });
            await replyInteraction.reply({ content: 'Ticket panel deployed.', ephemeral: true });
        }
    }
} as Command;
