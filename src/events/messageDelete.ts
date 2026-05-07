import { Events, Message, PartialMessage } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.MessageDelete,
    run: async (client, message: Message | PartialMessage) => {
        if (!message.guild || message.author?.bot) return;

        client.snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            image: message.attachments.first()?.proxyURL || null,
            timestamp: Date.now()
        });

        await Logger.log(
            message.guild,
            'Message Deleted',
            `Message sent by ${message.author} deleted in ${message.channel}.`,
            'Red',
            [
                { name: 'Content', value: message.content ? message.content.slice(0, 1024) : 'No content (embed/image)' }
            ],
            LogCategory.Message
        );
    },
} as Event<Events.MessageDelete>;
