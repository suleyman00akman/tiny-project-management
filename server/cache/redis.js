const redis = require('redis');

const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function getClient() {
    if (!client.isOpen) {
        await client.connect();
    }
    return client;
}

const CACHE_TTL = 3600; // 1 hour

const getCache = async (key) => {
    try {
        const c = await getClient();
        const data = await c.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`Cache Get Error [${key}]:`, err);
        return null;
    }
};

const setCache = async (key, value, ttl = CACHE_TTL) => {
    try {
        const c = await getClient();
        await c.set(key, JSON.stringify(value), {
            EX: ttl
        });
    } catch (err) {
        console.error(`Cache Set Error [${key}]:`, err);
    }
};

const deleteCache = async (key) => {
    try {
        const c = await getClient();
        await c.del(key);
    } catch (err) {
        console.error(`Cache Delete Error [${key}]:`, err);
    }
};

const clearCachePrefix = async (prefix) => {
    try {
        const c = await getClient();
        const keys = await c.keys(`${prefix}*`);
        if (keys.length > 0) {
            await c.del(keys);
        }
    } catch (err) {
        console.error(`Cache Clear Prefix Error [${prefix}]:`, err);
    }
};

module.exports = {
    getCache,
    setCache,
    deleteCache,
    clearCachePrefix
};
