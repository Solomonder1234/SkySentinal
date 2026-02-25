import { Message, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const command: Command = {
    name: 'loadecline',
    description: 'Decline a staff member\'s LOA request and revert nickname (Head of Staff/Founder only)',
    category: 'Staff',
    run: async (client, message, args) => {
        if (!(message instanceof Message)) return;

        // Permission Check: HOS or Founder
        const member = message.member;
        if (!member) return;

        const isAuthorized = member.roles.cache.some((r: any) =>
            ['founder', 'head of staff', 'hos'].includes((r.name ?? '').toLowerCase()) ||
            r.permissions.has('Administrator')
        );

        if (!isAuthorized) {
            return message.reply({ embeds: [EmbedUtils.error('Access Denied', 'This command is restricted to **Head of Staff** and **Founders**.')] });
        }

        const targetMember = message.mentions.members?.first() || message.guild?.members.cache.get(args[0] ?? '');
        if (!targetMember) {
            return message.reply({ content: '❌ Please mention a valid staff member to decline.' });
        }

        // Check for pending LOA
        const pendingLOA = await client.prisma.lOA.findFirst({
            where: {
                userId: targetMember.id,
                guildId: message.guildId as string,
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!pendingLOA) {
            return message.reply({ content: `❌ No pending LOA request found for <@${targetMember.id}>.` });
        }

        // Update record
        await client.prisma.lOA.update({
            where: { id: pendingLOA.id },
            data: { status: 'DECLINED' }
        });

        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Revert Nickname (Remove [LOA] prefix)
        try {
            const currentNickname = targetMember.nickname || targetMember.user.username;
            if (currentNickname.startsWith('[LOA]')) {
                const newNickname = currentNickname.replace(/^\[LOA\]\s*/, '').trim();
                await targetMember.setNickname(newNickname);
            }
        } catch (err) {
            client.logger.warn(`Could not revert LOA nickname for ${targetMember.user.tag}: ${err}`);
        }

        const logChannelId = '1386829080237969469';
        const logChannel = client.channels.cache.get(logChannelId) as TextChannel;

        const embed = new EmbedBuilder()
            .setTitle('❌ LOA Request Declined')
            .setColor('#FF0000')
            .setAuthor({
                name: targetMember.user.tag,
                iconURL: targetMember.user.displayAvatarURL()
            })
            .addFields(
                { name: 'Staff Member', value: `<@${targetMember.id}>`, inline: true },
                { name: 'Declined By', value: `<@${message.author.id}>`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();

        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }

        // Notify user
        try {
            await targetMember.send({
                embeds: [EmbedUtils.error('LOA Declined', `Your Leave of Absence request in **${message.guild?.name}** has been declined.\n**Reason:** ${reason}`)]
            });
        } catch (e) { }

        return message.reply({
            embeds: [EmbedUtils.success('LOA Declined', `Successfully declined LOA for <@${targetMember.id}>.`)]
        });
    }
};

export default command;
