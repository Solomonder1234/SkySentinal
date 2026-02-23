import { Events, VoiceState, EmbedBuilder } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.VoiceStateUpdate,
    run: async (client, oldState: VoiceState, newState: VoiceState) => {
        if (!newState.guild || (newState.member && newState.member.user.bot)) return;

        const member = newState.member;
        if (!member) return;

        let action = '';
        let color: any = 'Blue';
        const fields = [];

        // Joined a channel
        if (!oldState.channelId && newState.channelId) {
            action = 'Joined Voice Channel';
            color = 'Green';
            fields.push({ name: 'Channel', value: `<#${newState.channelId}>` });
        }
        // Left a channel
        else if (oldState.channelId && !newState.channelId) {
            action = 'Left Voice Channel';
            color = 'Red';
            fields.push({ name: 'Channel', value: `<#${oldState.channelId}>` });
        }
        // Moved channels
        else if (oldState.channelId !== newState.channelId) {
            action = 'Moved Voice Channels';
            color = 'Orange';
            fields.push(
                { name: 'Old Channel', value: `<#${oldState.channelId}>` },
                { name: 'New Channel', value: `<#${newState.channelId}>` }
            );
        }

        // Mute/Deafen status
        if (oldState.selfMute !== newState.selfMute) {
            action = newState.selfMute ? 'Muted Self' : 'Unmuted Self';
            color = newState.selfMute ? 'Grey' : 'Blue';
        }
        if (oldState.selfDeaf !== newState.selfDeaf) {
            action = newState.selfDeaf ? 'Deafened Self' : 'Undeafened Self';
            color = newState.selfDeaf ? 'Grey' : 'Blue';
        }
        if (oldState.streaming !== newState.streaming) {
            action = newState.streaming ? 'Started Streaming' : 'Stopped Streaming';
            color = newState.streaming ? 'Purple' : 'Blue';
        }

        if (action) {
            await Logger.log(
                newState.guild,
                action,
                `User: ${member.user} (${member.user.tag})`,
                color,
                fields
            );
        }
    },
} as Event<Events.VoiceStateUpdate>;
