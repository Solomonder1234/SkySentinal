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

            // Define High-Fidelity Intelligence Modules
            const MODULES = [
                {
                    id: 'security',
                    label: 'Shield & Security Ops',
                    description: 'Directives for hostiles, clearance, and network defense.',
                    emoji: '🛡️',
                    categories: ['Moderation', 'Admin', 'Verification', 'Antinuke']
                },
                {
                    id: 'executive',
                    label: 'Executive Command',
                    description: 'System-wide configuration and owner-level overrides.',
                    emoji: '📡',
                    categories: ['Owner', 'Configuration']
                },
                {
                    id: 'intelligence',
                    label: 'Network Intelligence',
                    description: 'Telemetry data, system info, and core utility links.',
                    emoji: 'ℹ️',
                    categories: ['Info', 'Server', 'Utility']
                },
                {
                    id: 'field',
                    label: 'Field Operations',
                    description: 'Communication relays, tickets, and audio telemetry.',
                    emoji: '📟',
                    categories: ['Tickets', 'Voice', 'Radio']
                },
                {
                    id: 'citizenship',
                    label: 'Citizenship & Economy',
                    description: 'User progression, leveling, and financial records.',
                    emoji: '💰',
                    categories: ['Economy', 'Leveling']
                },
                {
                    id: 'engagement',
                    label: 'Broadcast Engagement',
                    description: 'Multimedia tools, simulated content, and troll protocols.',
                    emoji: '🎮',
                    categories: ['Fun', 'Image', 'Text', 'Troll']
                }
            ];

            const options = MODULES.map(mod => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(mod.label)
                    .setValue(mod.id)
                    .setDescription(mod.description)
                    .setEmoji(mod.emoji);
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Deploy a specific Intelligence Module...')
                .addOptions(options);

            const row = new ActionRowBuilder<any>().addComponents(selectMenu);

            const embed = EmbedUtils.info(
                '✨ SkySentinel Intelligence Hub',
                `Welcome to the advanced administration suite. Explore our extensive toolset using the tactical module selection below.\n\n**Operational Statistics**\n• Active Command Nodes: **${commands.size}**\n• Primary Protocols: \`!\` | \`/\`\n\n*Select a module to view its corresponding operational directives.*`
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

                const moduleId = i.values[0];
                const selectedModule = MODULES.find(m => m.id === moduleId);
                
                if (!selectedModule) return;

                const moduleCommands = commands.filter((c: any) => 
                    selectedModule.categories.includes(c.category)
                );

                // Group by sub-category in the display
                let fieldContent = '';
                for (const cat of selectedModule.categories) {
                    const catCmds = moduleCommands.filter((c: any) => c.category === cat);
                    if (catCmds.size > 0) {
                        fieldContent += `\n**[ ${cat.toUpperCase()} ]**\n`;
                        fieldContent += catCmds.map(c => `• \`${c.name}\``).join(', ') + '\n';
                    }
                }

                const newEmbed = EmbedUtils.info(`${selectedModule.emoji} ${selectedModule.label}`, fieldContent || 'No directives found in this sector.')
                    .setDescription(`*Current operational tools in the ${selectedModule.label} sector:*\n${fieldContent}`)
                    .setFooter({ text: `Sub-Sector: ${selectedModule.id.toUpperCase()} • Total: ${moduleCommands.size} commands` });

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
