import { prisma } from "@/lib/prisma";

export const logger = {
    info: async (message: string) => {
        console.log(`[INFO] ${message}`);
        // Optional: Log to DB
        // await prisma.log.create({ data: { level: 'INFO', message } });
    },
    error: async (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error);
        try {
            await prisma.log.create({ data: { level: 'ERROR', message: message + (error ? ': ' + JSON.stringify(error) : '') } });
        } catch (e) {
            console.error("Failed to write log to DB", e);
        }
    },
    warn: async (message: string) => {
        console.warn(`[WARN] ${message}`);
    }
};
