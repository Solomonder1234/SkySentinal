import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const FT_ROLE_ID = '1477159814449594483';
const PT_ROLE_ID = '1477159649265319956';

export default {
    name: 'ft',
    description: 'Set your staff availability to Full-Time.',
    type: ApplicationCommandType.ChatInput,
    prefixOnly: true,
    run: async (client, interaction) => {
        if (!(interaction instanceof Message) || !interaction.member) return;
        const member = interaction.member as GuildMember;

        let apiWarning = '';
        try {
            if (member.roles.cache.has(PT_ROLE_ID)) await member.roles.remove(PT_ROLE_ID);
            if (!member.roles.cache.has(FT_ROLE_ID)) await member.roles.add(FT_ROLE_ID);
        } catch (e) { apiWarning = '\n*(Manual Role update required due to hierarchy)*'; }

        try {
            let currentName = member.displayName;
            currentName = currentName.replace(/^\[FT\]\s*/i, '').replace(/^\[PT\]\s*/i, '');
            const newName = `[FT] ${currentName}`.substring(0, 32);
            if (member.displayName !== newName) await member.setNickname(newName);
        } catch (e) { apiWarning += '\n*(Manual Nickname update required due to hierarchy)*'; }

        await interaction.reply({
            embeds: [EmbedUtils.success('Availability Updated', `Successfully set your status to **Full-Time** [FT].${apiWarning}`)]
        });
    },
} as Command;
