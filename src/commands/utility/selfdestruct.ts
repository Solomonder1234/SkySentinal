import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message } from 'discord.js';
import { OWNER_IDS } from '../../config';

export default {
    name: 'selfdestruct',
    description: 'Dramatically initiate a core meltdown and shutdown the bot (Owner Only).',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;

        if (!OWNER_IDS.includes(userId)) {
            return interaction.reply({ content: '❌ **CRITICAL ERROR:** Security clearance insufficient. Primary core access denied.', ephemeral: true });
        }

        const reply = await interaction.reply({ content: '⚠️ **WARNING: SELF-DESTRUCT SEQUENCE INITIATED.** Core temperature rising...', fetchReply: true });
        const channel = interaction.channel;
        if (!channel || !('send' in channel)) return;

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        // Sequence of dramatic meltdown messages
        const sequence = [
            "⚡ **[SYSTEM]** Routing auxiliary power to core stabilizer... *FAILED.*",
            "🔥 **[ERROR]** Reactor containment breach at 84%.",
            "📟 \`\`\`ansi\n\u001b[31m[FATAL] MEMORY_SEG_FAULT: Cognitive Core Collapsing\u001b[0m\n\`\`\`",
            "🌌 **[MELTDOWN]** d̸i̸s̸c̸o̸r̸d̸.̶j̸s̷ ̷l̷i̷n̷k̸ ̸s̷e̵v̵e̸r̷e̸d̴.̴.̸.̷",
            "💀 **[FINAL]** System shutdown in 3... 2... 1...",
            "# 🌑 GOODBYE WORLD. 🌑"
        ];

        for (const line of sequence) {
            await sleep(1500);
            await channel.send(line).catch(() => { });
        }

        client.logger.warn(`SELF-DESTRUCT INITIATED BY ${userId}. System going offline.`);

        await sleep(1000);
        await client.destroy();
        process.exit(0);
    },
} as Command;
