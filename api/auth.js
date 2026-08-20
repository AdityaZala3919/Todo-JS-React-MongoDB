import { connectToDatabase } from './_db.js';
import bcrypt from 'bcryptjs';

function getPreconfiguredUsers() {
    const users = [];

    // 1. Check PRECONFIGURED_USERS JSON string
    if (process.env.PRECONFIGURED_USERS) {
        try {
            let raw = process.env.PRECONFIGURED_USERS.trim();
            // Strip leading and trailing single or double quotes if present
            if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
                raw = raw.slice(1, -1).trim();
            }
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                users.push(...parsed);
            }
        } catch (e) {
            console.warn('[API Auth] Failed to parse PRECONFIGURED_USERS env variable:', e.message);
        }
    }

    // 2. Also check numbered environment variables (e.g. USER_1_EMAIL, USER_1_PASSWORD / USER_1_HASH, etc.)
    for (let i = 1; i <= 20; i++) {
        const email = process.env[`USER_${i}_EMAIL`];
        const passwordHash = process.env[`USER_${i}_HASH`] || process.env[`USER_${i}_PASSWORD_HASH`];
        const plainPassword = process.env[`USER_${i}_PASSWORD`];
        const id = process.env[`USER_${i}_ID`];
        const displayName = process.env[`USER_${i}_NAME`] || process.env[`USER_${i}_DISPLAY_NAME`];

        if (email && (passwordHash || plainPassword)) {
            users.push({
                id: id || `static-user-${i}`,
                email: email.toLowerCase().trim(),
                password_hash: passwordHash,
                password: plainPassword,
                display_name: displayName || email.split('@')[0],
            });
        }
    }

    return users;
}

async function verifyStaticUserPassword(staticUser, inputPassword) {
    if (staticUser.password_hash) {
        if (staticUser.password_hash.startsWith('$2a$') || staticUser.password_hash.startsWith('$2b$') || staticUser.password_hash.startsWith('$2y$')) {
            return await bcrypt.compare(inputPassword, staticUser.password_hash);
        }
        return inputPassword === staticUser.password_hash;
    }
    if (staticUser.password) {
        return inputPassword === staticUser.password;
    }
    return false;
}

export default async (req, res) => {
    // Standard CORS headers for serverless environment
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method } = req;
    const { action, id } = req.query;

    try {
        // GET: Get user profile details
        if (method === 'GET') {
            if (!id) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Check preconfigured users first
            const staticUsers = getPreconfiguredUsers();
            const staticUser = staticUsers.find(u => u.id === id);
            if (staticUser) {
                const { password_hash, password: p, ...safeUser } = staticUser;
                return res.status(200).json({
                    id: safeUser.id,
                    email: safeUser.email,
                    display_name: safeUser.display_name,
                    created_at: safeUser.created_at || new Date().toISOString(),
                    updated_at: safeUser.updated_at || new Date().toISOString(),
                });
            }

            const { db } = await connectToDatabase();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: id });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Return user details without security credentials
            const { password_hash, ...safeUser } = user;
            safeUser.id = user._id;
            return res.status(200).json(safeUser);
        }

        // POST: Perform registration, login, or settings update actions
        if (method === 'POST') {
            const body = req.body || {};

            if (action === 'register') {
                const { email, password, display_name, id: clientUserId } = body;
                if (!email || !password || !clientUserId) {
                    return res.status(400).json({ error: 'Email, password, and client ID are required' });
                }

                const { db } = await connectToDatabase();
                const usersCollection = db.collection('users');

                const existing = await usersCollection.findOne({ email: email.toLowerCase() });
                if (existing) {
                    return res.status(400).json({ error: 'An account with this email already exists' });
                }

                // Hash password using bcrypt
                const password_hash = await bcrypt.hash(password, 10);
                const userDoc = {
                    _id: clientUserId,
                    email: email.toLowerCase(),
                    password_hash,
                    display_name: display_name || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                await usersCollection.insertOne(userDoc);
                const { password_hash: ph, ...safeUser } = userDoc;
                safeUser.id = userDoc._id;
                return res.status(201).json(safeUser);
            }

            if (action === 'login') {
                const { email, password } = body;
                if (!email || !password) {
                    return res.status(400).json({ error: 'Email and password are required' });
                }

                const cleanEmail = email.toLowerCase().trim();

                // 1. Fast-path: Check static / preconfigured env users before opening MongoDB connection
                const staticUsers = getPreconfiguredUsers();
                const staticUser = staticUsers.find(u => u.email.toLowerCase() === cleanEmail);

                if (staticUser) {
                    const isValid = await verifyStaticUserPassword(staticUser, password);
                    if (isValid) {
                        const { password_hash, password: p, ...safeUser } = staticUser;
                        return res.status(200).json({
                            id: safeUser.id,
                            email: safeUser.email,
                            display_name: safeUser.display_name,
                            created_at: safeUser.created_at || new Date().toISOString(),
                            updated_at: safeUser.updated_at || new Date().toISOString(),
                        });
                    }
                }

                // 2. Fallback to MongoDB
                const { db } = await connectToDatabase();
                const usersCollection = db.collection('users');
                const user = await usersCollection.findOne({ email: cleanEmail });
                if (!user) {
                    return res.status(400).json({ error: 'Invalid email or password' });
                }

                const valid = await bcrypt.compare(password, user.password_hash);
                if (!valid) {
                    return res.status(400).json({ error: 'Invalid email or password' });
                }

                const { password_hash: ph, ...safeUser } = user;
                safeUser.id = user._id;
                return res.status(200).json(safeUser);
            }

            if (action === 'change-password') {
                const { user_id, old_password, new_password } = body;
                if (!user_id || !old_password || !new_password) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const { db } = await connectToDatabase();
                const usersCollection = db.collection('users');

                const user = await usersCollection.findOne({ _id: user_id });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const valid = await bcrypt.compare(old_password, user.password_hash);
                if (!valid) {
                    return res.status(400).json({ error: 'Current password is incorrect' });
                }

                const password_hash = await bcrypt.hash(new_password, 10);
                await usersCollection.updateOne(
                    { _id: user_id },
                    { $set: { password_hash, updated_at: new Date().toISOString() } }
                );

                return res.status(200).json({ success: true });
            }

            if (action === 'update-profile') {
                const { user_id, display_name } = body;
                if (!user_id || !display_name) {
                    return res.status(400).json({ error: 'User ID and display name are required' });
                }

                const { db } = await connectToDatabase();
                const usersCollection = db.collection('users');

                await usersCollection.updateOne(
                    { _id: user_id },
                    { $set: { display_name: display_name.trim(), updated_at: new Date().toISOString() } }
                );

                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ error: 'Invalid POST action' });
        }

        return res.status(405).json({ error: `Method ${method} not allowed` });
    } catch (err) {
        console.error('[API Auth] Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
