import { MongoClient } from 'mongodb';
import dns from 'dns';



// Force Node.js to use public DNS servers (Google/Cloudflare) to reliably resolve MongoDB Atlas SRV records
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('[DB] Warning: Failed to set custom DNS servers:', err.message);
}

let cachedClient = globalThis.__mongoClient || null;
let cachedDb = globalThis.__mongoDb || null;
let cachedConnectPromise = globalThis.__mongoConnectPromise || null;

// Default to a local MongoDB URI if MONGODB_URI is not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'TaskFlowTodo';

export async function connectToDatabase() {
    if (globalThis.__mongoClient && globalThis.__mongoDb) {
        return { client: globalThis.__mongoClient, db: globalThis.__mongoDb };
    }

    if (globalThis.__mongoConnectPromise) {
        return await globalThis.__mongoConnectPromise;
    }

    // Options for MongoClient connection pooling
    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 1,
    });

    globalThis.__mongoConnectPromise = (async () => {
        await client.connect();
        const db = client.db(MONGODB_DB);

        globalThis.__mongoClient = client;
        globalThis.__mongoDb = db;
        cachedClient = client;
        cachedDb = db;

        return { client, db };
    })();

    return await globalThis.__mongoConnectPromise;
}

