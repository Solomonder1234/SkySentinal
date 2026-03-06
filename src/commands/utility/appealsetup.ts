import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'appealsetup',
    description: 'Deploys the SkySentinel Formal Appeals Center panel.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const member = interaction.member as any;
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        const isAdmin = member?.permissions?.has('Administrator');
        const isGlobalAdmin = user.id === '753372101540577431';

        if (!isAdmin && interaction.guild?.ownerId !== member.id && !isGlobalAdmin) {
            return interaction.reply({ content: 'Only Administrators can use this command.', ephemeral: true });
        }

        const appealGifs = [
            'https://media.giphy.com/media/26tn33aiTi1jIGsnu/giphy.gif', // Analysis terminal
            'https://media.giphy.com/media/3o7TKrEzvLbgzGhiaA/giphy.gif', // Tech scan
            'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif' // Database visual
        ];
        const selectedGif = appealGifs[Math.floor(Math.random() * appealGifs.length)];

        const embed = EmbedUtils.premium(
            'Infraction Appeals Center',
            'If you believe you were falsely penalized (warned, muted, or kicked), you may submit a formal appeal directly to the Senior Enforcement Branch.\n\n***Protocol Notice:*** Providing false information or spamming this system will result in stricter enforcement actions.'
        )
            .setImage(selectedGif || null)
            .setFooter({ text: 'SkySentinel AV • Appeals Directive' });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('appeal_btn_start')
                .setLabel('Submit Formal Appeal')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚖️')
        );

        if (interaction instanceof Message) {
            if (interaction.channel && interaction.channel.isTextBased()) {
                await (interaction.channel as any).send({ embeds: [embed], components: [row] });
            }
            await interaction.reply({ content: 'Appeals panel deployed.', flags: ['Ephemeral'] as any }).catch(() => null);
        } else {
            const replyInteraction = interaction as ChatInputCommandInteraction;
            await (replyInteraction.channel as TextChannel)?.send({ embeds: [embed], components: [row as any] });
            await replyInteraction.reply({ content: 'Appeals panel deployed.', ephemeral: true });
        }
    }
} as Command;
