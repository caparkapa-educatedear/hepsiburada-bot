import { Telegraf } from 'telegraf';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class BotService {
    static async sendPendingProducts() {
        logger.info('Checking for pending products to send...');

        // Get Settings
        const settings = await prisma.botSettings.findFirst({ where: { isActive: true } });
        if (!settings || !settings.botToken || !settings.channelUsername) {
            logger.warn('Bot settings not configured or inactive.');
            return;
        }

        const bot = new Telegraf(settings.botToken);

        // Get Active Template
        const template = await prisma.template.findFirst({ where: { isActive: true } });
        const contentTemplate = template?.content || '🔥 {name}\n💰 {price}\n🔗 {url}';

        // Get Pending Products (sentAt is null)
        // Limit to 5 per run to avoid flooding Telegram API if scrape is huge
        const pendingProducts = await prisma.product.findMany({
            where: { sentAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        if (pendingProducts.length === 0) {
            logger.info('No pending products.');
            return;
        }

        for (const product of pendingProducts) {
            try {
                const message = this.formatMessage(contentTemplate, product);

                if (product.imageUrl) {
                    await bot.telegram.sendPhoto(settings.channelUsername, product.imageUrl, {
                        caption: message,
                        parse_mode: 'HTML' // Or Markdown
                    });
                } else {
                    await bot.telegram.sendMessage(settings.channelUsername, message, {
                        parse_mode: 'HTML'
                    });
                }

                // Mark as sent
                await prisma.product.update({
                    where: { id: product.id },
                    data: { sentAt: new Date() }
                });

                logger.info(`Sent product: ${product.name}`);

                // Rate limit dampener
                await new Promise(r => setTimeout(r, 2000));

            } catch (error) {
                logger.error(`Failed to send product ${product.id}`, error);
            }
        }
    }

    private static formatMessage(template: string, product: any): string {
        let msg = template;
        msg = msg.replace(/{name}/g, product.name)
            .replace(/{price}/g, product.price)
            .replace(/{originalPrice}/g, product.originalPrice || '')
            .replace(/{discountRate}/g, product.discountRate || '')
            .replace(/{url}/g, product.url);

        // Cleanup empty lines if placeholder was empty
        // msg = msg.replace(/^\s*[\r\n]/gm, ''); 
        return msg;
    }
}
