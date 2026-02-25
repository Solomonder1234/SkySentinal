import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { VERSION_STRING } from '../../config';

export default {
    name: 'help',
    description: 'Get a list of all commands.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'command',
            description: 'The command to get help for.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let commandName: string | undefined;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            commandName = args[0];
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            commandName = chatInteraction.options.getString('command') || undefined;
        }

        if (commandName) {
            const command = client.commands.get(commandName) || client.commands.find((c: any) => c.aliases?.includes(commandName!));
            if (!command) return interaction.reply({ content: 'Command not found.' });

            const embed = EmbedUtils.info(`Command: ${command.name} `, command.description || 'No description provided.')
                .addFields(
                    { name: 'Aliases', value: command.aliases ? command.aliases.join(', ') : 'None', inline: true },
                    { name: 'Permissions', value: command.defaultMemberPermissions ? `${command.defaultMemberPermissions} ` : 'None', inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        } else {
            const commands = client.commands;
            const categories = [...new Set(commands.map(c => c.category || 'Uncategorized'))].sort();

            const emojiMap: Record<string, string> = {
                'Moderation': '🛡️', 'Utility': '🛠️', 'Info': 'ℹ️',
                'Fun': '🎮', 'Economy': '💰', 'Image': '🖼️',
                'Leveling': '📈', 'Configuration': '⚙️', 'Voice': '🎙️', 'Troll': '🤡'
            };

            const options = categories.map(cat => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(cat.substring(0, 80))
                    .setValue(cat) // Safely matched without trailing spaces to prevent string mismatch bugs!
                    .setDescription(`Browse commands in the ${cat} section.`)
                    .setEmoji(emojiMap[cat] || '📁');
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Select a Command Module...')
                .addOptions(options);

            const row = new ActionRowBuilder<any>().addComponents(selectMenu);

            const embed = EmbedUtils.info(
                '✨ SkySentinel Control Panel',
                `Welcome to the advanced administration suite. Explore our extensive toolset using the dropdown menu below.\n\n**System Statistics**\n• Total Modules Loaded: **${commands.size}**\n• Prefix: \`!\` or \`/\`\n\n*Select a category to view its corresponding commands.*`
            ).setFooter({ text: VERSION_STRING });

            let replyMessage: Message;
            if (interaction instanceof Message) {
                replyMessage = await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                replyMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            }

            const collector = replyMessage.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 5 * 60 * 1000 // 5 minutes
            });

            collector.on('collect', async (i) => {
                if (interaction instanceof Message) {
                    if (i.user.id !== interaction.author.id) {
                        return i.reply({ content: 'These options are not for you.', ephemeral: true });
                    }
                } else if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'These options are not for you.', ephemeral: true });
                }

                const catName = i.values[0] || 'Uncategorized';
                const categoryCommands = commands.filter((c: any) => (c.category || 'Uncategorized') === catName);

                // Detailed command list formatting
                const commandList = categoryCommands.map(c => `**\`${c.name}\`** - ${c.description || 'No description available'}`).join('\n');

                const newEmbed = EmbedUtils.info(`${emojiMap[catName] || '📁'} ${catName} Commands`, commandList)
                    .setFooter({ text: `Total: ${categoryCommands.size} commands • Use /help <command> for more info.` });

                await i.update({ embeds: [newEmbed], components: [row] });
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder<any>().addComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                );
                replyMessage.edit({ components: [disabledRow] }).catch(() => { });
            });

            return;
        }
    },
} as Command;
