import { Message, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

const command: Command = {
    name: 'loadb',
    description: 'View the active Leave of Absence (LOA) database records (Staff Only)',
    category: 'Staff',
    run: async (client, message) => {
        if (!(message instanceof Message)) return;

        const member = message.member;
        if (!member) return;

        const isAuthorized = message.author.id === message.guild?.ownerId || member.roles.cache.some((r: any) =>
            ['founder', 'head of staff', 'hos'].includes((r.name ?? '').toLowerCase()) ||
            r.permissions.has('Administrator')
        );

        if (!isAuthorized) {
            return message.reply({ embeds: [EmbedUtils.error('Access Denied', 'This command is restricted to **Head of Staff** and **Founders**.')] });
        }

        try {
            const activeLOAs = await client.prisma.lOA.findMany({
                where: {
                    guildId: message.guildId as string,
                    status: 'APPROVED'
                },
                orderBy: { createdAt: 'desc' }
            });

            if (activeLOAs.length === 0) {
                return message.reply({ embeds: [EmbedUtils.info('Active LOA Database', 'There are currently **0** active staff members on Leave of Absence.')] });
            }

            const embed = new EmbedBuilder()
                .setTitle('✈️ Active Staff LOA Tracking Database')
                .setColor('#FFD700')
                .setDescription(`Currently monitoring **${activeLOAs.length}** approved leaves of absence across the server.`)
                .setTimestamp();

            for (const loa of activeLOAs) {
                if (embed.data.fields && embed.data.fields.length >= 25) break;
                const startDate = `<t:${Math.floor(loa.createdAt.getTime() / 1000)}:R>`;
                embed.addFields({
                    name: `ID: ${loa.id} | User: ${loa.userId}`,
                    value: `**Duration:** ${loa.duration}\n**Reason:** ${loa.reason}\n**Started:** ${startDate}`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
        } catch (err) {
            client.logger.error('Failed to load LOA DB:', err);
            return message.reply({ embeds: [EmbedUtils.error('Database Error', 'Could not retrieve active logs at this time.')] });
        }
    }
};

export default command;
