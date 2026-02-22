export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const webhookURL = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookURL) {
        return res.status(500).json({ error: 'Webhook URL not configured on server' });
    }

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        if (response.ok) {
            return res.status(200).json({ message: 'Sent' });
        } else {
            return res.status(response.status).json({ error: 'Discord Error' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}