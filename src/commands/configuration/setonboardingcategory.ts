import { Message, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../lib/structures/Command';

export default {
    name: 'setonboardingcategory',
    description: 'Sets the category where onboarding channels will be created.',
    permissions: [PermissionFlagsBits.Administrator],
    aliases: ['setobcat'],
    run: async (client, message: Message, args: string[]) => {
        const categoryId = args[0];

        if (!categoryId) {
            return message.reply('❌ **Please provide a valid Category ID.**');
        }

        const category = message.guild?.channels.cache.get(categoryId);
        if (!category || category.type !== 4) { // 4 is Category
            return message.reply('❌ **That is not a valid Category ID in this server.**');
        }

        try {
            await client.database.prisma.guildConfig.update({
                where: { id: message.guild!.id },
                data: { onboardingChannelId: categoryId }
            });

            return message.reply(`✅ **Onboarding Category has been set to: \`${category.name}\` (**\`${categoryId}\`**).**`);
        } catch (error) {
            client.logger.error('Failed to update onboarding category:', error);
            return message.reply('❌ **Failed to update the database.**');
        }
    }
} as Command;
