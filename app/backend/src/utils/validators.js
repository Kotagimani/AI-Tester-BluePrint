export function validateTicketId(ticketId) {
    if (!ticketId || typeof ticketId !== 'string') return false;
    return /^[A-Z][A-Z0-9]+-\d+$/.test(ticketId.trim());
}

export function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').trim();
}
