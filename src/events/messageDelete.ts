import { Events, Message, PartialMessage } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.MessageDelete,
    run: async (client, message: Message | PartialMessage) => {
        if (!message.guild || message.author?.bot) return;

        await Logger.log(
            message.guild,
            'Message Deleted',
            `Message sent by ${message.author} deleted in ${message.channel}.`,
            'Red',
            [
                { name: 'Content', value: message.content ? message.content.slice(0, 1024) : 'No content (embed/image)' }
            ]
        );
    },
} as Event<Events.MessageDelete>;
