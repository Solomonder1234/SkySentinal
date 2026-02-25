import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const command: Command = {
    name: 'loa',
    description: 'Request a Leave of Absence (Staff Only)',
    category: 'Staff',
    run: async (client, message, args) => {
        if (!(message instanceof Message)) {
            return message.reply({ content: '❌ This command is now available via `!loa` only.', ephemeral: true });
        }

        if (args.length < 2) {
            return message.reply({
                content: '❌ Invalid Syntax! Use: `!loa <Duration> <Reason>`\nExample: `!loa 3 days Family vacation`'
            });
        }

        const duration = args[0] ?? '';
        const reason = args.slice(1).join(' ');

        const logChannelId = '1386829080237969469';
        const logChannel = client.channels.cache.get(logChannelId) as TextChannel;

        if (!logChannel) {
            return message.reply({ content: '❌ LOA submission failed: Staff log channel not found.' });
        }

        // Check for existing pending LOA
        const existingPending = await client.prisma.lOA.findFirst({
            where: {
                userId: message.author.id,
                guildId: message.guildId as string,
                status: 'PENDING'
            }
        });

        if (existingPending) {
            return message.reply({ content: '❌ You already have a pending LOA request. Please wait for it to be reviewed.' });
        }

        // Create LOA record
        const loaRecord = await client.prisma.lOA.create({
            data: {
                userId: message.author.id,
                guildId: message.guildId as string,
                duration: duration as string,
                reason: reason as string,
                status: 'PENDING'
            }
        });

        const embed = new EmbedBuilder()
            .setTitle('✈️ LOA Request Submitted')
            .setColor('#FFA500')
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
            })
            .addFields(
                { name: 'Staff Member', value: `<@${message.author.id}> (${message.author.id})`, inline: false },
                { name: 'Duration', value: duration || 'Not specified', inline: true },
                { name: 'Status', value: '⏳ Pending Review', inline: true },
                { name: 'Reason', value: reason || 'Not specified', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'LOA Request System' });

        await logChannel.send({ embeds: [embed] });

        // Update Nickname
        try {
            const member = message.member;
            if (member) {
                const currentNickname = member.nickname || message.author.username;
                // Detect existing prefix like [MOD] or [ADMIN]
                const prefixMatch = currentNickname.match(/^(\[[^\]]+\])/);
                const prefix = prefixMatch ? prefixMatch[1] : '';
                const baseName = currentNickname.replace(/^\[.*?\]\s*|\{.*?\}\s*|\|.*?\|\s*/g, '').trim();

                // Construct: [LOA] [PREFIX] Username (or just [LOA] Username if no prefix)
                const newNickname = `[LOA] ${prefix ? prefix + ' ' : ''}${baseName}`.substring(0, 32);
                await member.setNickname(newNickname);
            }
        } catch (err: any) {
            client.logger.warn(`Could not update LOA nickname for ${message.author.tag}: ${err.message}`);
        }

        return message.reply({
            embeds: [EmbedUtils.success('LOA Submitted', 'Your Leave of Absence request has been sent to the Head of Staff for review.')]
        });
    }
};

export default command;
