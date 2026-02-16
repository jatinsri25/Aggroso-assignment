
type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const store: RateLimitStore = new Map();

interface RateLimitConfig {
    interval: number; // in milliseconds
    limit: number;
}

const CLEANUP_INTERVAL = 60000; // 1 minute

// Background cleanup
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of store.entries()) {
            if (value.expiresAt < now) {
                store.delete(key);
            }
        }
    }, CLEANUP_INTERVAL).unref(); // Ensure it doesn't block process exit
}

export async function rateLimit(identifier: string, config: RateLimitConfig = { interval: 60000, limit: 5 }) {
    const now = Date.now();
    const key = identifier;

    const record = store.get(key);

    if (!record) {
        store.set(key, {
            count: 1,
            expiresAt: now + config.interval
        });
        return { success: true, remaining: config.limit - 1, reset: now + config.interval };
    }

    if (now > record.expiresAt) {
        // Expired, reset
        store.set(key, {
            count: 1,
            expiresAt: now + config.interval
        });
        return { success: true, remaining: config.limit - 1, reset: now + config.interval };
    }

    if (record.count >= config.limit) {
        return { success: false, remaining: 0, reset: record.expiresAt };
    }

    // Increment
    record.count++;
    store.set(key, record);

    return { success: true, remaining: config.limit - record.count, reset: record.expiresAt };
}
