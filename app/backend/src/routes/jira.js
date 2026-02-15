import { Router } from 'express';
import db from '../database.js';
import { fetchTicket } from '../services/jira-client.js';
import { validateTicketId } from '../utils/validators.js';

const router = Router();

// Fetch a JIRA ticket
router.post('/fetch', async (req, res) => {
    try {
        const { ticketId } = req.body;

        if (!validateTicketId(ticketId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ticket ID format. Expected format: PROJECT-123',
            });
        }

        const ticket = await fetchTicket(ticketId.trim());
        res.json({ success: true, ticket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get recently fetched tickets
router.get('/recent', (req, res) => {
    try {
        const tickets = db.prepare(
            'SELECT ticket_id, summary, fetched_at FROM tickets ORDER BY fetched_at DESC LIMIT 5'
        ).all();
        res.json({ success: true, tickets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
