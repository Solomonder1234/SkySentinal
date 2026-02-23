import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';

export default {
    name: 'mock',
    description: 'CoNvErT tExT tO mOcKiNg CaSe.',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'user',
            description: 'The user to persist-mock (Toggles on/off every message).',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
        {
            name: 'text',
            description: 'One-time text to mock.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let text: string | null = null;
        let targetUser = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const mention = args[0];
            const userId = mention?.replace(/[<@!>]/g, '');

            if (userId && (await client.users.fetch(userId).catch(() => null))) {
                targetUser = await client.users.fetch(userId);
            } else {
                text = args.join(' ');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user');
            text = chatInteraction.options.getString('text');
        }

        // Toggle persistent mock
        if (targetUser) {
            const profile = await client.database.prisma.userProfile.upsert({
                where: { id: targetUser.id },
                create: { id: targetUser.id },
                update: {}
            });

            if (profile.isImmune) {
                return interaction.reply({
                    content: `🛡️ **${targetUser.tag}** is protected by Supreme Immunity. They cannot be mocked.`,
                    ephemeral: true
                });
            }

            const newState = !profile.isMocked;
            await client.database.prisma.userProfile.update({
                where: { id: targetUser.id },
                data: { isMocked: newState }
            });

            return interaction.reply({
                content: `🤡 **Reactive Mocking** has been **${newState ? 'ENABLED' : 'DISABLED'}** for **${targetUser.tag}**. ${newState ? 'EvErY mEsSaGe ThEy SeNd WiLl bE mOcKeD.' : 'They are safe... for now.'}`
            });
        }

        // One-time text mock
        if (text) {
            const mockedText = text.split('').map((char, index) => {
                return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
            }).join('');
            return interaction.reply({ content: mockedText });
        }

        return interaction.reply({ content: 'Please provide either a **user** to persist-mock or **text** to mock once.', ephemeral: true });
    },
} as Command;
