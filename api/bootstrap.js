import { connectToDatabase } from './_db.js';

export default async (req, res) => {
    // CORS headers for serverless environment
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method } = req;
    const userId = req.headers['x-user-id'] || req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const { db } = await connectToDatabase();

        // 1. Fetch primary collections concurrently using Promise.all for high performance
        const [
            userDoc,
            projects,
            tags,
            tasks,
            time_sessions,
            existingSettingsDoc,
            notes
        ] = await Promise.all([
            db.collection('users').findOne({ _id: userId }),
            db.collection('projects').find({ user_id: userId }).toArray(),
            db.collection('tags').find({ user_id: userId }).toArray(),
            db.collection('tasks').find({ user_id: userId }).toArray(),
            db.collection('time_sessions').find({ user_id: userId }).toArray(),
            db.collection('user_settings').findOne({ _id: userId }),
            db.collection('notes').find({ user_id: userId }).toArray(),
        ]);

        let user = userDoc;
        if (user) {
            delete user.password_hash;
            user.id = user._id;
        }
        const users = user ? [user] : [];

        let userSettingsDoc = existingSettingsDoc;
        if (!userSettingsDoc) {
            // Instantiate default settings in DB if not found
            userSettingsDoc = {
                _id: userId,
                user_id: userId,
                theme: 'dark',
                default_view: 'dashboard',
                week_start_day: 1,
                settings_json: '{}',
                updated_at: new Date().toISOString(),
            };
            await db.collection('user_settings').insertOne(userSettingsDoc);
        }

        // Extract task IDs to resolve linked task properties concurrently
        const taskIds = tasks.map(t => t._id || t.id);

        let recurrence_rules = [];
        let task_tags = [];
        let task_occurrences = [];

        if (taskIds.length > 0) {
            [recurrence_rules, task_tags, task_occurrences] = await Promise.all([
                db.collection('recurrence_rules').find({ task_id: { $in: taskIds } }).toArray(),
                db.collection('task_tags').find({ task_id: { $in: taskIds } }).toArray(),
                db.collection('task_occurrences').find({ task_id: { $in: taskIds } }).toArray(),
            ]);
        }

        // Respond with all datasets mapped together
        return res.status(200).json({
            users,
            projects,
            tags,
            tasks,
            time_sessions,
            user_settings: userSettingsDoc ? [userSettingsDoc] : [],
            recurrence_rules,
            task_tags,
            task_occurrences,
            notes: notes || [],
        });
    } catch (err) {
        console.error('[API Bootstrap] Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
