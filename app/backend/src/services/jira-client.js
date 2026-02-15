import { decrypt } from '../utils/encryption.js';
import db from '../database.js';

export async function fetchTicket(ticketId) {
    // Get JIRA settings
    const baseUrlRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_base_url');
    const usernameRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_username');
    const tokenRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_api_token');

    if (!baseUrlRow || !usernameRow || !tokenRow) {
        throw new Error('JIRA is not configured. Please set up JIRA credentials in Settings.');
    }

    const baseUrl = baseUrlRow.value;
    const username = usernameRow.value;
    const apiToken = decrypt(tokenRow.value);

    const url = `${baseUrl}/rest/api/3/issue/${ticketId}`;
    const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) {
            throw new Error('JIRA authentication failed. Please check your credentials.');
        }
        if (response.status === 404) {
            throw new Error(`Ticket ${ticketId} not found.`);
        }
        throw new Error(`JIRA API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    // Extract relevant fields
    const ticket = {
        ticketId: data.key,
        summary: data.fields?.summary || '',
        description: extractDescription(data.fields?.description),
        priority: data.fields?.priority?.name || 'None',
        status: data.fields?.status?.name || 'Unknown',
        assignee: data.fields?.assignee?.displayName || 'Unassigned',
        labels: data.fields?.labels || [],
        acceptanceCriteria: extractAcceptanceCriteria(data.fields),
        attachments: (data.fields?.attachment || []).map(a => ({
            filename: a.filename,
            url: a.content,
        })),
    };

    // Cache the ticket
    db.prepare(
        'INSERT INTO tickets (ticket_id, summary, data_json) VALUES (?, ?, ?)'
    ).run(ticket.ticketId, ticket.summary, JSON.stringify(ticket));

    return ticket;
}

export async function testConnection() {
    const baseUrlRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_base_url');
    const usernameRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_username');
    const tokenRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('jira_api_token');

    if (!baseUrlRow || !usernameRow || !tokenRow) {
        return { connected: false, message: 'JIRA credentials not configured' };
    }

    const baseUrl = baseUrlRow.value;
    const username = usernameRow.value;
    const apiToken = decrypt(tokenRow.value);

    try {
        const url = `${baseUrl}/rest/api/3/myself`;
        const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            const user = await response.json();
            return { connected: true, message: `Connected as ${user.displayName}` };
        }
        return { connected: false, message: `Authentication failed (${response.status})` };
    } catch (err) {
        return { connected: false, message: `Connection error: ${err.message}` };
    }
}

function extractDescription(descField) {
    if (!descField) return '';
    if (typeof descField === 'string') return descField;

    // Atlassian Document Format (ADF) - extract text nodes
    function extractText(node) {
        if (!node) return '';
        if (node.type === 'text') return node.text || '';
        if (node.content) return node.content.map(extractText).join('\n');
        return '';
    }
    return extractText(descField);
}

function extractAcceptanceCriteria(fields) {
    // Try common custom field names
    const customFieldNames = [
        'customfield_10028', // Common AC field
        'customfield_10029',
        'customfield_10100',
    ];

    for (const fieldName of customFieldNames) {
        if (fields[fieldName]) {
            const val = fields[fieldName];
            if (typeof val === 'string') return val;
            if (val?.content) return extractDescription(val);
        }
    }

    // Try to extract from description
    const desc = extractDescription(fields?.description);
    const acMatch = desc.match(/(?:acceptance criteria|AC)[:\s]*\n?([\s\S]*?)(?:\n\n|\n(?=[A-Z])|\n---)/i);
    if (acMatch) return acMatch[1].trim();

    return '';
}
