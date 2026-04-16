import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, TextChannel, Message, CategoryChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'permissionsetup',
    description: 'Automatically locks down the server for new users and intelligently hides staff categories.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    prefixOnly: true, // Keep it off slash commands to save the 100 limit quota
    run: async (client: any, interaction: any) => {
        const message = interaction as Message;

        if (!message.guild) return message.reply('This command can only be used in a server.');
        
        const guild = message.guild;

        const sentMessage = await message.reply({ 
            embeds: [EmbedUtils.info('Server Setup', 'Initiating advanced classification lockdown...')] 
        });

        try {
            // 1. Revoke generic visibility from everyone
            const everyoneRole = guild.roles.everyone;
            await everyoneRole.setPermissions(everyoneRole.permissions.remove(PermissionFlagsBits.ViewChannel)).catch(() => null);

            // 2. Grant global visibility to the Member role
            const FALLBACK_MEMBER_ROLE_ID = '1370396828490666135'; 
            let memberRole = guild.roles.cache.get(FALLBACK_MEMBER_ROLE_ID);
            if (!memberRole) {
                memberRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('member'));
            }

            if (memberRole) {
                await memberRole.setPermissions(memberRole.permissions.add(PermissionFlagsBits.ViewChannel)).catch(() => null);
            }

            // 3. Intelligently scan through all channels and categories
            const classifiedKeywords = ['staff', 'owner', 'admin', 'mod', 'management'];
            const entranceKeywords = ['rules', 'onboarding'];

            let restrictedCategories = 0;
            let publicChannels = 0;
            let memberChannels = 0;

            for (const channel of guild.channels.cache.values()) {
                if (channel.isThread()) continue;

                // Check if it's a blocked category OR a child of a blocked category
                const isClassified = classifiedKeywords.some(keyword => {
                    if (channel.name.toLowerCase().includes(keyword)) return true;
                    if (channel.parentId) {
                        const parent = guild.channels.cache.get(channel.parentId);
                        if (parent && parent.name.toLowerCase().includes(keyword)) return true;
                    }
                    return false;
                });

                if (isClassified) {
                    if (channel.type === ChannelType.GuildCategory) restrictedCategories++;
                    
                    // Forcefully hide from everyone and member
                    await (channel as any).permissionOverwrites.edit(everyoneRole, { ViewChannel: false }).catch(() => null);
                    if (memberRole) {
                        await (channel as any).permissionOverwrites.edit(memberRole, { ViewChannel: false }).catch(() => null);
                    }
                    continue;
                }

                // If it's an entrance channel, expose it to everyone
                if (entranceKeywords.some(name => channel.name.toLowerCase().includes(name))) {
                    await (channel as any).permissionOverwrites.edit(everyoneRole, {
                        ViewChannel: true,
                        SendMessages: channel.name.toLowerCase().includes('onboarding') ? true : false,
                        ReadMessageHistory: true
                    }).catch(() => null);
                    publicChannels++;
                    continue;
                }

                // If it is a normal channel or category, completely hide it from @everyone, and EXPLICITLY show it to @Member
                await (channel as any).permissionOverwrites.edit(everyoneRole, { ViewChannel: false }).catch(() => null);
                
                if (memberRole) {
                    await (channel as any).permissionOverwrites.edit(memberRole, { 
                        ViewChannel: true,
                        ReadMessageHistory: true
                    }).catch(() => null);
                }

                if (channel.type !== ChannelType.GuildCategory) memberChannels++;
            }

            const roleName = memberRole ? "'" + memberRole.name + "'" : 'Member';
            const desc = "Successfully re-mapped entire server permissions recursively.\n\n🔒 **" + restrictedCategories + " Classified Categories** completely barricaded from Members and Everyone.\n🔑 **" + memberChannels + " Public Channels** explicitly exposed to the " + roleName + " role.\n🔓 **" + publicChannels + " Entrance Channels** opened globally for unverified users.";

            await sentMessage.edit({
                embeds: [
                    EmbedUtils.success('Hierarchy Restructured 🛡️', desc)
                ]
            });

        } catch (err: any) {
            client.logger.error('Failed to setup permissions:', err);
            await sentMessage.edit({
                embeds: [EmbedUtils.error('Setup Failed', "I encountered an error trying to set up permissions!\n\nError: " + err.message)]
            });
        }
    }
} as Command;
