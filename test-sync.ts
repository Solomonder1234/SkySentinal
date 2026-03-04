import { REST, Routes, ApplicationCommandType } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
config();

async function test() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    // Mock a couple commands or just load them
    const slashCommands = [
        {
            name: 'ping',
            description: 'Pong',
            type: 1
        }
    ];

    try {
        await rest.put(
            Routes.applicationGuildCommands('1145152865761042534', '1466918766490292480'),
            { body: slashCommands }
        );
        console.log("Success");
    } catch (e: any) {
        console.error(e.message);
        console.error(e.requestBody);
    }
}
test();
