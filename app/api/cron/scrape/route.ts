import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScraperService } from '@/lib/services/scraper';
import { BotService } from '@/lib/services/bot';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Verify Secret
    const settings = await prisma.botSettings.findFirst({ select: { cronSecret: true } });
    const validSecret = settings?.cronSecret || process.env.CRON_SECRET || 'changeme'; // Fallback

    if (key !== validSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Scrape
        const scrapedProducts = await ScraperService.scrape();

        // 2. Save to DB
        let newCount = 0;
        for (const p of scrapedProducts) {
            const exists = await prisma.product.findUnique({ where: { externalId: p.externalId } });
            if (!exists) {
                await prisma.product.create({
                    data: {
                        externalId: p.externalId,
                        name: p.name,
                        price: p.price,
                        originalPrice: p.originalPrice,
                        discountRate: p.discountRate,
                        url: p.url,
                        imageUrl: p.imageUrl,
                    }
                });
                newCount++;
            }
        }

        logger.info(`Database updated. New products: ${newCount}`);

        // 3. Trigger Bot
        await BotService.sendPendingProducts();

        return NextResponse.json({
            success: true,
            scraped: scrapedProducts.length,
            new: newCount
        });

    } catch (error: any) {
        logger.error('Cron job failed', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
