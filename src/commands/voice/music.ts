import { Command } from '../../lib/structures/Command';
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    PermissionFlagsBits,
    Message,
    ChatInputCommandInteraction,
    GuildMember,
    TextChannel
} from 'discord.js';

export default {
    name: 'music',
    description: 'Play music from YouTube using the DisTube AV Engine.',
    category: 'Voice',
    aliases: ['play', 'p', 'stop', 'skip', 'queue', 'q', 'vol', 'volume', 'loop', 'filter', 'filters'],
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Connect,
    options: [
        {
            name: 'play',
            description: 'Play a YouTube video or playlist.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'query',
                    description: 'YouTube URL or search query.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        },
        {
            name: 'stop',
            description: 'Stop music and disconnect.',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'skip',
            description: 'Skip the current track.',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'queue',
            description: 'Show the current music queue.',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'volume',
            description: 'Set the music volume (0-100).',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'amount',
                    description: 'Volume level (0-100).',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                }
            ]
        },
        {
            name: 'autoplay',
            description: 'Toggle automatic music playback.',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;
        let query: string | null = null;
        let volume: number | null = null;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const trigger = interaction.content.split(' ')[0]?.toLowerCase().slice(1);

            if (trigger === 'play' || trigger === 'p') {
                subcommand = 'play';
                query = args.join(' ');
            } else if (trigger === 'stop') {
                subcommand = 'stop';
            } else if (trigger === 'skip') {
                subcommand = 'skip';
            } else if (trigger === 'queue' || trigger === 'q') {
                subcommand = 'queue';
            } else if (trigger === 'vol' || trigger === 'volume') {
                subcommand = 'volume';
                volume = parseInt(args[0] || '100');
            } else {
                subcommand = args[0]?.toLowerCase() || 'play';
                if (subcommand === 'play') {
                    query = args.slice(1).join(' ');
                } else if (subcommand === 'volume' || subcommand === 'vol') {
                    volume = parseInt(args[1] || '100');
                } else if (!['stop', 'skip', 'queue'].includes(subcommand)) {
                    query = args.join(' ');
                    subcommand = 'play';
                }
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            if (subcommand === 'play') query = chatInteraction.options.getString('query');
            if (subcommand === 'volume') volume = chatInteraction.options.getInteger('amount');
        }

        const member = interaction.member as GuildMember;
        if (!member?.voice?.channel) {
            const msg = '❌ You must be in a voice channel!';
            return interaction.reply({ content: msg });
        }

        const guildId = interaction.guildId!;

        if (subcommand === 'play') {
            if (!query) {
                const msg = '❌ Please provide a YouTube URL or a search query.';
                return interaction.reply({ content: msg });
            }

            if (!(interaction instanceof Message)) {
                await interaction.deferReply();
            } else if (interaction.channel instanceof TextChannel) {
                await interaction.channel.sendTyping();
            }

            try {
                const voiceChannel = member.voice.channel;
                await client.music.play(member, voiceChannel, query, interaction);

                const response = `🔍 Searching for: **${query}**\n🎶 Establishing DisTube Supreme connection...`;
                if (interaction instanceof Message) return interaction.reply(response);
                else return interaction.editReply(response);
            } catch (error: any) {
                client.logger.error(`[Music] Play Command Error:`, error);
                const msg = `❌ **Error:** ${error.message}`;
                return interaction instanceof Message ? interaction.reply(msg) : interaction.editReply(msg);
            }
        }

        if (subcommand === 'stop') {
            client.music.stop(guildId);
            return interaction.reply('🛑 Stopped music and cleared the queue.');
        }

        if (subcommand === 'skip') {
            try {
                await client.music.skip(guildId);
                return interaction.reply('⏭️ Skipped current track.');
            } catch (error) {
                return interaction.reply('❌ Nothing to skip or queue finished.');
            }
        }

        if (subcommand === 'volume') {
            if (volume === null || isNaN(volume)) return interaction.reply('❌ Please provide a valid volume level (0-100).');
            client.music.distube.setVolume(guildId, volume);
            return interaction.reply(`🔊 Volume set to: **${volume}%**`);
        }

        if (subcommand === 'queue') {
            const queue = client.music.getQueue(guildId);
            if (!queue || queue.songs.length === 0) {
                return interaction.reply('The queue is empty.');
            }

            const currentSong = queue.songs[0];
            const queueList = queue.songs.slice(1, 11).map((song, i) => `${i + 1}. **${song.name}** - \`${song.formattedDuration}\``).join('\n');
            const response = `🎵 **AV Music Queue**\n\n**Now Playing:** ${currentSong ? currentSong.name : 'Unknown'}\n\n${queueList || '*Empty*'}${queue.songs.length > 11 ? `\n*...and ${queue.songs.length - 11} more*` : ''}`;

            return interaction.reply({ content: response });
        }

        if (subcommand === 'autoplay') {
            const queue = client.music.getQueue(guildId);
            if (!queue) return interaction.reply('❌ No active queue.');
            const mode = queue.toggleAutoplay();
            return interaction.reply(`📻 Autoplay is now **${mode ? 'Enabled' : 'Disabled'}**.`);
        }
    },
} as Command;
