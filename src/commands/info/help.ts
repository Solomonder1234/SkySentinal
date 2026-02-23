import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';

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
            const command = client.commands.get(commandName) || client.commands.find(c => c.aliases?.includes(commandName!));
            if (!command) return interaction.reply({ content: 'Command not found.' });

            const embed = EmbedUtils.info(`Command: ${command.name}`, command.description || 'No description provided.')
                .addFields(
                    { name: 'Aliases', value: command.aliases ? command.aliases.join(', ') : 'None', inline: true },
                    { name: 'Permissions', value: command.defaultMemberPermissions ? `${command.defaultMemberPermissions}` : 'None', inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        } else {
            const commands = client.commands;
            const categories = [...new Set(commands.map(c => c.category || 'Uncategorized'))].sort();

            // Generate Buttons for Categories
            const buildRows = (cats: string[]) => {
                const rows: ActionRowBuilder<ButtonBuilder>[] = [];
                let currentRow = new ActionRowBuilder<ButtonBuilder>();

                cats.forEach((cat, index) => {
                    if (index > 0 && index % 4 === 0) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder<ButtonBuilder>();
                    }

                    const emojiMap: Record<string, string> = {
                        'Moderation': '🛡️', 'Utility': '🛠️', 'Info': 'ℹ️',
                        'Fun': '🎮', 'Economy': '💰', 'Image': '🖼️',
                        'Leveling': '📈', 'Configuration': '⚙️', 'Voice': '🎙️', 'Troll': '🤡'
                    };

                    const emoji = emojiMap[cat] || '📁';

                    currentRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`help_cat_${cat}`)
                            .setEmoji(emoji)
                            .setLabel(cat.substring(0, 80)) // Discord limits label length
                            .setStyle(ButtonStyle.Secondary)
                    );
                });

                if (currentRow.components.length > 0) rows.push(currentRow);
                return rows;
            };

            const embed = EmbedUtils.info('📚 SkySentinel Administrative Center', `Total Commands: **${commands.size}**\n\n*Select a category below to browse the AV command suite.*`)
                .setFooter({ text: 'SkySentinel • v7.0.5 ALPHA AV Engine Transition' });

            const components = buildRows(categories);

            let replyMessage: Message;
            if (interaction instanceof Message) {
                replyMessage = await interaction.reply({ embeds: [embed], components: components.slice(0, 5) }); // Max 5 rows
            } else {
                replyMessage = await interaction.reply({ embeds: [embed], components: components.slice(0, 5), fetchReply: true });
            }

            const collector = replyMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 5 * 60 * 1000 // 5 minutes
            });

            collector.on('collect', async (i) => {
                // Ensure only the person who ran the command can use the buttons
                if (interaction instanceof Message) {
                    if (i.user.id !== interaction.author.id) {
                        return i.reply({ content: 'These options are not for you.', ephemeral: true });
                    }
                } else if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'These options are not for you.', ephemeral: true });
                }

                const catName = i.customId.replace('help_cat_', '');
                const categoryCommands = commands.filter(c => (c.category || 'Uncategorized') === catName);
                const commandList = categoryCommands.map(c => `\`${c.name}\``).join(', ');

                const emojiMap: Record<string, string> = {
                    'Moderation': '🛡️', 'Utility': '🛠️', 'Info': 'ℹ️',
                    'Fun': '🎮', 'Economy': '💰', 'Image': '🖼️',
                    'Leveling': '📈', 'Configuration': '⚙️', 'Voice': '🎙️', 'Troll': '🤡'
                };

                const newEmbed = EmbedUtils.info(`${emojiMap[catName] || '📁'} ${catName} Commands`, commandList)
                    .setFooter({ text: `Total: ${categoryCommands.size} commands • Use /help <command> for more info.` });

                await i.update({ embeds: [newEmbed], components: components.slice(0, 5) });
            });

            collector.on('end', () => {
                const disabledRows = components.map(row => {
                    const disabledRow = new ActionRowBuilder<ButtonBuilder>();
                    row.components.forEach(btn => disabledRow.addComponents(ButtonBuilder.from(btn).setDisabled(true)));
                    return disabledRow;
                });
                replyMessage.edit({ components: disabledRows.slice(0, 5) }).catch(() => { });
            });

            return;
        }
    },
} as Command;
