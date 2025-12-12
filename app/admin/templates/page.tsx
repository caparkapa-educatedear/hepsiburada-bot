import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Plus, Check, X, Trash } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function toggleTemplate(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const isActive = formData.get('isActive') === 'true';

    // If setting to active, deactivate all others
    if (!isActive) { // We are switching TO active
        await prisma.template.updateMany({ data: { isActive: false } });
    }

    await prisma.template.update({
        where: { id },
        data: { isActive: !isActive }
    });

    revalidatePath('/admin/templates');
}

async function deleteTemplate(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await prisma.template.delete({ where: { id } });
    revalidatePath('/admin/templates');
}

async function createTemplate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;

    await prisma.template.create({
        data: { name, content, isActive: false }
    });
    revalidatePath('/admin/templates');
}

export default async function TemplatesPage() {
    const templates = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Şablonlar</h1>
                    <p className="text-slate-500 dark:text-slate-400">Telegram mesaj formatlarını yönetin.</p>
                </div>

                {/* Simple Create Form inline for speed, or a button to separate page. Inline is faster for now */}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Şablon Adı</th>
                            <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">İçerik Önizleme</th>
                            <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Durum</th>
                            <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {templates.map((template) => (
                            <tr key={template.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{template.name}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs max-w-xs truncate">{template.content}</td>
                                <td className="px-6 py-4">
                                    {template.isActive ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                            <Check className="h-3 w-3" />
                                            Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                            <X className="h-3 w-3" />
                                            Pasif
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">

                                    <form action={toggleTemplate}>
                                        <input type="hidden" name="id" value={template.id} />
                                        <input type="hidden" name="isActive" value={String(template.isActive)} />
                                        <button type="submit" className={`text-xs px-3 py-1.5 rounded-md border font-medium ${template.isActive ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-primary text-white border-primary hover:bg-blue-600'}`}>
                                            {template.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                                        </button>
                                    </form>

                                    <form action={deleteTemplate}>
                                        <input type="hidden" name="id" value={template.id} />
                                        <button type="submit" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {templates.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Henüz şablon bulunmuyor. Aşağıdan yeni bir tane ekleyin.
                    </div>
                )}
            </div>

            {/* Create Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Yeni Şablon Ekle</h3>
                <form action={createTemplate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Şablon Adı</label>
                        <input type="text" name="name" required placeholder="Örn: Black Friday Teması" className="w-full p-2 border rounded-md dark:bg-slate-900/50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mesaj İçeriği</label>
                        <div className="text-xs text-slate-500 mb-2 space-x-2">
                            <span>Mevcut Değişkenler:</span>
                            <code className="bg-slate-100 px-1 rounded">{`{name}`}</code>
                            <code className="bg-slate-100 px-1 rounded">{`{price}`}</code>
                            <code className="bg-slate-100 px-1 rounded">{`{originalPrice}`}</code>
                            <code className="bg-slate-100 px-1 rounded">{`{discountRate}`}</code>
                            <code className="bg-slate-100 px-1 rounded">{`{url}`}</code>
                        </div>
                        <textarea name="content" required rows={4} placeholder="🔥 {name} sadece {price}! Link: {url}" className="w-full p-2 border rounded-md font-mono text-sm dark:bg-slate-900/50"></textarea>
                    </div>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Şablon Oluştur
                    </button>
                </form>
            </div>
        </div>
    );
}
