import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // I don't have these yet, I will inline or create generic divs
import { Package, Send, Clock, CircleCheck, CircleAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const productCount = await prisma.product.count();
    const sentCount = await prisma.product.count({ where: { sentAt: { not: null } } });

    const settings = await prisma.botSettings.findFirst();
    const activeTemplate = await prisma.template.findFirst({ where: { isActive: true } });

    const lastProduct = await prisma.product.findFirst({ orderBy: { createdAt: 'desc' } });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Genel Bakış</h1>
                <p className="text-slate-500 dark:text-slate-400">Bot ve sistem durumu hakkında özet bilgi.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Stat Cards */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-slate-500">Toplam Ürün</h3>
                        <Package className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{productCount}</div>
                    <p className="text-xs text-slate-500 mt-1">İşlenen benzersiz fırsat</p>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-slate-500">Gönderilen</h3>
                        <Send className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{sentCount}</div>
                    <p className="text-xs text-slate-500 mt-1">Telegram'a iletilen</p>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-slate-500">Son Kontrol</h3>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {lastProduct ? new Date(lastProduct.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Son ürün işlenme saati</p>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-slate-500">Bot Durumu</h3>
                        {settings?.isActive ? (
                            <CircleCheck className="h-4 w-4 text-green-500" />
                        ) : (
                            <CircleAlert className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {settings?.isActive ? 'Aktif' : 'Pasif'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                        {activeTemplate?.name || 'Şablon Yok'}
                    </p>
                </div>
            </div>

            {/* Cron Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Cron Kurulum Bilgisi</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Botun çalışması için hosting panelinizden (cPanel/Plesk) aşağıdaki Cron Job'u 5 veya 15 dakikada bir çalışacak şekilde ayarlayın:
                    </p>
                    <div className="mt-2 bg-white dark:bg-slate-950 p-2 rounded border border-blue-200 dark:border-blue-900 font-mono text-xs overflow-x-auto select-all">
                        curl -s "https://your-domain.com/api/cron/scrape?key={settings?.cronSecret || 'changeme'}"
                    </div>
                </div>
            </div>
        </div>
    );
}
