import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Import routes
import settingsRoutes from './routes/settings.js';
import jiraRoutes from './routes/jira.js';
import llmRoutes from './routes/llm.js';
import templateRoutes from './routes/templates.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/testplan', llmRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 TestPlan AI Agent Backend running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
