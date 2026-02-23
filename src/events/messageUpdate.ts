import { Events, Message, PartialMessage } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.MessageUpdate,
    run: async (client, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // Reduce spam from embeds loading

        await Logger.log(
            newMessage.guild,
            'Message Edited',
            `Message sent by ${newMessage.author} edited in ${newMessage.channel}.`,
            'Yellow',
            [
                { name: 'Before', value: oldMessage.content ? oldMessage.content.slice(0, 1024) : 'Unknown' },
                { name: 'After', value: newMessage.content ? newMessage.content.slice(0, 1024) : 'Unknown' }
            ]
        );
    },
} as Event<Events.MessageUpdate>;
