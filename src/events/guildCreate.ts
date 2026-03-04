import { Event } from '../lib/structures/Event';
import { Events, Guild, REST, Routes } from 'discord.js';

export default {
    name: Events.GuildCreate,
    run: async (client, guild: Guild) => {
        client.logger.info(`Joined new guild: ${guild.name} (${guild.id})`);

        // Insert database config
        try {
            await client.database.prisma.guildConfig.upsert({
                where: { id: guild.id },
                update: {},
                create: { id: guild.id }
            });
            client.logger.info(`Initialized GuildConfig for ${guild.id}`);
        } catch (e) {
            client.logger.error(`Failed to initialize GuildConfig for ${guild.id}`, e);
        }

        // Deploy Slash Commands to the new guild
        if (client.user?.id && process.env.DISCORD_TOKEN) {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            const slashCommands = client.commands
                .filter(cmd => !cmd.prefixOnly && cmd.description && cmd.description.length > 0)
                .map(cmd => {
                    const obj: any = {
                        name: cmd.name,
                        description: cmd.description,
                        options: cmd.options || [],
                        type: cmd.type
                    };
                    if (cmd.defaultMemberPermissions) {
                        obj.default_member_permissions = cmd.defaultMemberPermissions.toString();
                    }
                    return obj;
                });

            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: slashCommands }
                );
                client.logger.info(`Successfully synced ${slashCommands.length} slash commands to newly joined guild: ${guild.name}`);
            } catch (error) {
                client.logger.error(`Failed to sync slash commands to ${guild.name}:`, error);
            }
        }
    }
} as Event<Events.GuildCreate>;
