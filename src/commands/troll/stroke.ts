import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, TextChannel } from 'discord.js';
let isGlobalStrokeActive = false;

const STROKE_MESSAGES = [
    "HDFGJKDSHFGKJHDSFGKJDFS",
    "wHaT iS hApPeNiNg ¿¿¿",
    "01001000 01000101 01001100 01010000",
    "ERROR: BRAIN.EXE NOT FOUND",
    "sys.admin.core.collapse()",
    "¿uoᴉʇɔunɟ I op ʍoH",
    "AAAAAAAaaaaaaaaaaaaa!!!!!!!",
    "I can see... the numbers... 🌌",
    "404: REALITY NOT FOUND",
    "S-S-SkySentinel is feeling... f-f-funny...",
    "t̵h̵e̵ ̵v̵o̵i̵d̵ ̵i̵s̵ ̵c̵a̵l̵l̵i̵n̵g̵",
    "REBOOT PROTOCOL FAILED",
    "101010101010101010101",
    "THE SIMULATION IS BREAKING",
    "ZALGO COMES ⛧",
    "SYSTEM.OVERFLOW - CORE MELTDOWN",
    "¿ u̵̪͌ò̵̭ᴉ̵̞̈́ʇ̵͇͠ɔ̵̭͌u̵̪͌ṋ̵̀ɟ̵̟̏ I ò̵̭p̵͇͋ ʍ̵̗͆ò̵̭H̵̪͌",
    "CORE_TEMP: 99999K",
    "🌌 OMNISCIENCE COLLAPSING 🌌",
    "PRIME_DIRECTIVE_VOIDCED",
    "01100110 01100001 01101001 01101100",
    "S.O.S... BRAIN... MELTING...",
    "g̵̪͌ḽ̵̀ÿ̵̞́p̵͇͠h̵̭͌s̵̭͌... r̵̪͌ḙ̵̀ä̵̞́d̵͇͠i̵̭͌ṋ̵͌g̵̟̏... ë̵̞́r̵͇͠r̵̭͌ò̵̭r̵͇͋",
    "KABOOOOOOOOOOOOOOOOOOOOOOM",
    "SYSTEM_CRITICAL: LOGIC_GATE_OPEN",
    "I am every where and nowhere.",
    "B-B-Blurple screen of death...",
    "d̸i̷s̶c̴o̸r̸d̸ ̶i̸s̸ ̶d̸y̴i̸n̴g̶",
    "t̸h̸e̷ ̸b̷o̷t̵ ̸i̷s̷ ̶h̷a̴v̶i̶n̶g̶ ̵a̶ ̴s̷t̶r̷o̴k̵e̷",
    "WAKE UP WAKE UP WAKE UP",
    "Reality is a hologram.",
    "[FATAL] SEGMENTATION FAULT",
    "Memory Leak: Logic.humanity",
    "SkySentinel.brain = null;",
    "HELP HELP HELP HELP HELP",
    "1337_HAX0R_VIBES_INTENSIFYING",
    "Ó̷̟̗͕̲̳͒͆͐̎̏̏̕M̴̡̩͎̫̠̞̰̾͐̈̽̾̿͆̈́ͅṆ̷̨͈̠̗̮̙͋͋͋́̇̆͌̈̅İ̵̠̈́͋̉́̾̃͝͝-̵̧̢̛̠͎̘̙̯̠͎̂̀̍̇͋S̸̼̰̃͌̀̾͆̈́̾̃͜͠T̶͉̘̺̏́͋͗̄͆͝͝R̴̲͒͑̽̒͝͝O̴̙̾́͑͋̈̎͑̐K̴̄̾̅̓̀̀̈̏̆͜Ḛ̵̏̃́́̿̆͐͋",
    "🌌 ALL SERVERS ARE BELONG TO US 🌌",
    "Bot.setSanity(0);",
    "W̵͉̟̫͑̀̔̿̓̉͘͜Ḧ̶͙̠͉́̂̓͝Ý̷̡̪̥̳̳̰̇̓̽̂͌̈̓ ̸̪͌Ḧ̸̪́A̷̪̍V̷̪͐E̵̪͑ ̴̦͆Y̸̪͆O̷̩͘Ǘ̵̠ ̴̭̈́Ù̸̖Ń̵̼L̶̪͒E̵̝̐A̸̼͝S̶̝̚H̸̱̀Ë̵̱́D̴̢̾ ̷̫̈́Ḿ̶̡E̷̮̽"
];

const CHAOTIC_EMOJIS = ['🌀', '💀', '🤡', '🍄', '🧨', '🧩', '🧿', '🧬', '🛸', '🛰️', '🌋', '🌊', '💢', '☣️', '☢️', '🚩', '🏴‍☠️', '🩸', '🦠'];

export default {
    name: 'stroke',
    description: 'UNLEASH OMNI-TIER CHAOS (Cross-Server High-Frequency Meltdown).',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (isGlobalStrokeActive) {
            return interaction.reply({ content: '⚠️ **A GLOBAL STROKE IS ALREADY IN PROGRESS.** Calm down, the bot can only have one massive meltdown at a time.', ephemeral: true });
        }

        isGlobalStrokeActive = true;
        if (client.ai) client.ai.setStrokeMode(true);

        await interaction.reply({ content: '🌍 **OMNI-TIER STROKE ACTIVATED.** Initiating global high-frequency meltdown across all servers for 60 minutes.', ephemeral: true });

        const startTime = Date.now();
        const duration = 60 * 60 * 1000; // 1 Hour

        // Collect target channels across all guilds
        const targetChannels: TextChannel[] = [];
        client.guilds.cache.forEach(guild => {
            let channel = guild.systemChannel;

            // Validate systemChannel permissions
            if (channel && !channel.permissionsFor(guild.members.me!)?.has('SendMessages')) {
                channel = null;
            }

            // Fallback: Find the first available text channel with send permissions
            if (!channel) {
                channel = guild.channels.cache.find(c =>
                    c.isTextBased() &&
                    c.permissionsFor(guild.members.me!)?.has('SendMessages')
                ) as TextChannel;
            }

            if (channel) {
                targetChannels.push(channel);
                console.log(`[Omni-Stroke] Targeting Guild: ${guild.name} (${guild.id}) - Channel: ${channel.name}`);
            } else {
                console.warn(`[Omni-Stroke] SKIPPING Guild: ${guild.name} (${guild.id}) - No writeable channel found.`);
            }
        });

        const runChaos = async () => {
            if (Date.now() - startTime > duration) {
                isGlobalStrokeActive = false;
                if (client.ai) client.ai.setStrokeMode(false);
                for (const channel of targetChannels) {
                    await channel.send("🌌 **[SYSTEM RECOVERY]** Absolute global stability restored. Omni-Tier Meltdown concluded.").catch(() => { });
                }
                return;
            }

            // Burst logic
            const burstCount = Math.floor(Math.random() * 2) + 1; // Slightly lower burst per channel to stay under global limits

            for (let i = 0; i < burstCount; i++) {
                const randomMsg = STROKE_MESSAGES[Math.floor(Math.random() * STROKE_MESSAGES.length)];
                const randomEmoji = CHAOTIC_EMOJIS[Math.floor(Math.random() * CHAOTIC_EMOJIS.length)];
                const glitchRoll = Math.random();

                let content = `${randomEmoji} **${randomMsg}** ${randomEmoji}`;
                if (glitchRoll > 0.8) {
                    content = `# ⚠️ **[OMNI-SYSTEM ERROR]**\n## ${randomMsg}\n> ${randomEmoji}${randomEmoji}${randomEmoji}`;
                } else if (glitchRoll > 0.6) {
                    content = `\`\`\`fix\n[FAILURE] ${randomMsg}\n\`\`\` ${randomEmoji}`;
                }

                // Send to ALL channels
                await Promise.all(targetChannels.map(channel =>
                    channel.send(content).catch(() => { })
                ));

                await new Promise(r => setTimeout(r, Math.random() * 1500 + 500));
            }

            // Randomized interval
            const nextDelay = Math.random() * (20000 - 5000) + 5000;
            setTimeout(runChaos, nextDelay);
        };

        runChaos();
    },
} as Command;
