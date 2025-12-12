import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Save } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function updateSettings(formData: FormData) {
    'use server';
    const botToken = formData.get('botToken') as string;
    const channelUsername = formData.get('channelUsername') as string;
    const cronSecret = formData.get('cronSecret') as string;
    const isActive = formData.get('isActive') === 'on';

    // We assume there's always one settings row (seeded)
    const first = await prisma.botSettings.findFirst();

    if (first) {
        await prisma.botSettings.update({
            where: { id: first.id },
            data: { botToken, channelUsername, isActive, cronSecret }
        });
    } else {
        await prisma.botSettings.create({
            data: { botToken, channelUsername, isActive, cronSecret }
        });
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
}

export default async function SettingsPage() {
    const settings = await prisma.botSettings.findFirst() || { botToken: '', channelUsername: '', isActive: true, cronSecret: 'changeme' };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Ayarlar</h1>
                <p className="text-slate-500 dark:text-slate-400">Bot yapılandırması ve bağlantı detayları.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <form action={updateSettings} className="space-y-6">

                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            defaultChecked={settings.isActive}
                            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="font-medium cursor-pointer select-none">
                            Bot Aktif (Veri çekme ve gönderme işlemi açık)
                        </label>
                    </div>

                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Telegram Bot Token</label>
                            <input
                                type="text"
                                name="botToken"
                                defaultValue={settings.botToken}
                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">BotFather'dan alınan token.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Telegram Kanal Kullanıcı Adı (veya Chat ID)</label>
                            <input
                                type="text"
                                name="channelUsername"
                                defaultValue={settings.channelUsername}
                                placeholder="@kanaladi veya -100123456789"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">Botun yönetici olduğu kanal.</p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Cron Güvenlik Anahtarı</label>
                            <input
                                type="text"
                                name="cronSecret"
                                defaultValue={settings.cronSecret}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Cron URL'ini korumak için kullanılan gizli anahtar (?key=...)</p>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2">
                        <Save className="h-5 w-5" />
                        Ayarları Kaydet
                    </button>
                </form>
            </div>
        </div>
    );
}
