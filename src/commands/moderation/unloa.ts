import { Message, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const command: Command = {
    name: 'unloa',
    description: 'Return from Leave of Absence and restore normal nickname (Staff Only)',
    category: 'Staff',
    run: async (client, message) => {
        if (!(message instanceof Message)) return;

        const member = message.member;
        if (!member) return;

        const currentNickname = member.nickname || member.user.username;
        if (!currentNickname.startsWith('[LOA]')) {
            return message.reply({ content: '❌ You are not currently marked as being on LOA.' });
        }

        // Find the active APPROVED LOA record
        const activeLOA = await client.prisma.lOA.findFirst({
            where: {
                userId: message.author.id,
                guildId: message.guildId as string,
                status: 'APPROVED'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (activeLOA) {
            await client.prisma.lOA.update({
                where: { id: activeLOA.id },
                data: { status: 'RETURNED' }
            });
        }

        // Revert Nickname (Remove [LOA] prefix)
        try {
            const newNickname = currentNickname.replace(/^\[LOA\]\s*/, '').trim();
            await member.setNickname(newNickname);
        } catch (err: any) {
            client.logger.warn(`Could not restore nickname for ${message.author.tag}: ${err.message}`);
            return message.reply({ content: '❌ Failed to restore your nickname. I might lack permissions.' });
        }

        const logChannelId = '1377295326272032960';
        const logChannel = client.channels.cache.get(logChannelId) as TextChannel;

        const embed = new EmbedBuilder()
            .setTitle('🏠 Returned from LOA')
            .setColor('#00FFFF')
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(`<@${message.author.id}> has officially returned from their Leave of Absence.`)
            .setTimestamp();

        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }

        return message.reply({
            embeds: [EmbedUtils.success('Welcome Back', 'Your LOA status has been removed and your nickname restored.')]
        });
    }
};

export default command;
