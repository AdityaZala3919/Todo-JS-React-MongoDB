import { connectToDatabase } from './_db.js';

export default async (req, res) => {
    // CORS headers for serverless environment
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID is required' });
    }

    const { collection, action, data } = req.body || {};
    if (!collection || !action || !data) {
        return res.status(400).json({ error: 'Missing collection, action, or data parameters' });
    }

    // Security whitelist of collections allowed to be mutated
    const allowedCollections = [
        'tasks',
        'projects',
        'tags',
        'task_tags',
        'recurrence_rules',
        'task_occurrences',
        'time_sessions',
        'user_settings',
    ];

    if (!allowedCollections.includes(collection)) {
        return res.status(400).json({ error: `Invalid collection name: ${collection}` });
    }

    try {
        const { db } = await connectToDatabase();
        const col = db.collection(collection);

        // INSERT: Replace or insert a single document using the client-side UUID as _id
        if (action === 'insert') {
            const doc = { ...data, _id: data.id || data.user_id };
            await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
            return res.status(200).json({ success: true });
        }

        // UPDATE: Update specific fields inside a single document
        if (action === 'update') {
            const id = data.id || data._id || data.user_id;
            const query = { _id: id };
            const { id: dummyId, _id: dummyId2, ...updateFields } = data;
            
            await col.updateOne(
                query,
                { $set: updateFields },
                { upsert: true }
            );
            return res.status(200).json({ success: true });
        }

        // DELETE: Delete a document by its ID (or composite key for task_tags)
        if (action === 'delete') {
            if (collection === 'task_tags') {
                const { task_id, tag_id } = data;
                await col.deleteOne({ task_id, tag_id });
            } else {
                const id = data.id || data._id;
                await col.deleteOne({ _id: id });
            }
            return res.status(200).json({ success: true });
        }

        // BULK UPDATE: Perform high-performance batch updates using bulkWrite (e.g. for task sorting)
        if (action === 'bulk_update') {
            if (!Array.isArray(data)) {
                return res.status(400).json({ error: 'Bulk update expects an array of datasets' });
            }

            const bulkOps = data.map(item => {
                const id = item.id || item._id;
                const { id: dummy, _id: dummy2, ...fields } = item;
                return {
                    updateOne: {
                        filter: { _id: id },
                        update: { $set: fields },
                        upsert: true,
                    },
                };
            });

            if (bulkOps.length > 0) {
                await col.bulkWrite(bulkOps);
            }
            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: `Invalid action specified: ${action}` });
    } catch (err) {
        console.error(`[API Sync] Error in ${collection} sync:`, err);
        return res.status(500).json({ error: err.message });
    }
};
