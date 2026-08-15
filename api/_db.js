import { MongoClient } from 'mongodb';
import dns from 'dns';



// Force Node.js to use public DNS servers (Google/Cloudflare) to reliably resolve MongoDB Atlas SRV records
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('[DB] Warning: Failed to set custom DNS servers:', err.message);
}

let cachedClient = null;
let cachedDb = null;

// Default to a local MongoDB URI if MONGODB_URI is not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'TaskFlowTodo';

export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Options for MongoClient connection pooling
    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    });

    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

