import { logger } from '@/lib/logger';

// Dynamic imports to prevent build issues if deps are missing
const chromium = require('@sparticuz/chromium-min');
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');

export interface ScrapedProduct {
    externalId: string;
    name: string;
    price: string;
    originalPrice?: string;
    discountRate?: string;
    url: string;
    imageUrl?: string;
}

export class ScraperService {
    private static TARGET_URL = 'https://www.hepsiburada.com/gunun-firsati-teklifi';

    static async scrape(): Promise<ScrapedProduct[]> {
        logger.info('Starting scrape job...');
        let browser;
        try {

            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                logger.info('Running in PRODUCTION mode (Vercel compliant)');
                browser = await puppeteerCore.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(
                        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
                    ),
                    headless: chromium.headless,
                });
            } else {
                logger.info('Running in DEV mode (Standard Puppeteer)');
                browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            const page = await browser.newPage();

            // Set viewport to desktop to ensure elements are visible
            await page.setViewport({ width: 1920, height: 1080 });

            logger.info(`Navigating to ${this.TARGET_URL}`);
            await page.goto(this.TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

            // Auto-scroll to load lazy images
            await this.autoScroll(page);

            // Scrape logic
            const products = await page.evaluate(() => {
                const items: any[] = [];
                const cards = document.querySelectorAll('li[id^="i"]');

                cards.forEach((card) => {
                    try {
                        const linkEl = card.querySelector('a');
                        if (!linkEl) return;

                        const url = linkEl.href;
                        const paths = url.split('/');
                        const externalId = paths[paths.length - 1].split('-p-')[1] || url;

                        const nameEl = card.querySelector('h3') || card.querySelector('[data-test-id="product-card-name"]');
                        const name = nameEl?.textContent?.trim() || 'Unknown Product';

                        const priceEl = card.querySelector('[data-test-id="price-current-price"]');
                        const price = priceEl?.textContent?.trim() || '';

                        const originalPriceEl = card.querySelector('[data-test-id="price-prev-price"]');
                        const originalPrice = originalPriceEl?.textContent?.trim() || undefined;

                        const discountEl = card.querySelector('[data-test-id="price-discount-ratio"]');
                        const discountRate = discountEl?.textContent?.trim() || undefined;

                        const imgEl = card.querySelector('img');
                        const imageUrl = imgEl?.src || imgEl?.dataset.src;

                        if (name && price) {
                            items.push({
                                externalId,
                                name,
                                price,
                                originalPrice,
                                discountRate,
                                url,
                                imageUrl
                            });
                        }
                    } catch (e) {
                        // Ignore single item error
                    }
                });
                return items;
            });

            logger.info(`Scraped ${products.length} products.`);
            return products as ScrapedProduct[];

        } catch (error) {
            logger.error('Scraping failed', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    private static async autoScroll(page: any) {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) { // Limit scroll
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }
}
