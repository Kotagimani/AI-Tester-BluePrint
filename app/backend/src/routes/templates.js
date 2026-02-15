import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { extractTextFromPDF, parseSections } from '../services/pdf-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

const router = Router();

// Upload a PDF template
router.post('/upload', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const { text, pages } = await extractTextFromPDF(filePath);

        if (!text.trim()) {
            // Clean up file
            fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, error: 'Could not extract text from PDF. The file may be scanned/image-based.' });
        }

        const name = req.body.name || req.file.originalname.replace('.pdf', '');
        const sections = parseSections(text);

        const result = db.prepare(
            'INSERT INTO templates (name, filename, content) VALUES (?, ?, ?)'
        ).run(name, req.file.originalname, text);

        // Clean up uploaded file after extracting text
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            template: {
                id: result.lastInsertRowid,
                name,
                filename: req.file.originalname,
                pages,
                sections,
                contentPreview: text.substring(0, 500),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// List all templates
router.get('/', (req, res) => {
    try {
        const templates = db.prepare(
            'SELECT id, name, filename, created_at FROM templates ORDER BY created_at DESC'
        ).all();
        res.json({ success: true, templates });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get a single template
router.get('/:id', (req, res) => {
    try {
        const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, template });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete a template
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
