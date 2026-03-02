import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message } from 'discord.js';

export default {
    name: 'infinite',
    description: 'Grant the Server Owner infinite economy balance.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (interaction.member?.user.id !== '753372101540577431') return;
        await client.database.prisma.userProfile.upsert({
            where: { id: '753372101540577431' },
            create: { id: '753372101540577431', balance: 999999999999999n },
            update: { balance: 999999999999999n }
        });
        if (interaction instanceof Message) {
            interaction.reply('✅ **Omni-Wealth Granted.** 999 Trillion has been injected into your portfolio.');
        } else {
            interaction.reply({ content: '✅ **Omni-Wealth Granted.** 999 Trillion has been injected into your portfolio.', ephemeral: true });
        }
    }
} as Command;
