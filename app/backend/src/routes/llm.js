import { Router } from 'express';
import db from '../database.js';
import { generateWithGroq } from '../services/groq-provider.js';
import { generateWithOllama, getOllamaModels } from '../services/ollama-provider.js';

const router = Router();

const SYSTEM_PROMPT = `You are an expert QA Engineer with 15+ years of experience. Generate a comprehensive, professional test plan based on the provided JIRA ticket details and following the structure of the template below.

Your test plan must:
1. Map ticket details to appropriate template sections
2. Maintain the template formatting and structure
3. Add specific, actionable test scenarios based on acceptance criteria
4. Include both positive and negative test cases
5. Cover edge cases and boundary conditions
6. Include smoke tests, regression tests, and integration tests where applicable
7. Be written in clear, professional language
8. Include test data suggestions where relevant

Format the output in clean Markdown.`;

// Generate a test plan
router.post('/generate', async (req, res) => {
    try {
        const { ticketId, templateId, provider } = req.body;

        if (!ticketId) {
            return res.status(400).json({ success: false, error: 'Ticket ID is required' });
        }

        // Get ticket data
        const ticketRow = db.prepare(
            'SELECT data_json, summary FROM tickets WHERE ticket_id = ? ORDER BY fetched_at DESC LIMIT 1'
        ).get(ticketId);

        if (!ticketRow) {
            return res.status(404).json({ success: false, error: 'Ticket not found. Please fetch it first.' });
        }

        const ticketData = JSON.parse(ticketRow.data_json);

        // Get template content if provided
        let templateContent = '';
        if (templateId) {
            const template = db.prepare('SELECT content FROM templates WHERE id = ?').get(templateId);
            if (template) {
                templateContent = template.content;
            }
        }

        // Build the prompt
        let prompt = `## JIRA Ticket Details\n`;
        prompt += `**Ticket ID:** ${ticketData.ticketId}\n`;
        prompt += `**Summary:** ${ticketData.summary}\n`;
        prompt += `**Priority:** ${ticketData.priority}\n`;
        prompt += `**Status:** ${ticketData.status}\n`;
        prompt += `**Assignee:** ${ticketData.assignee}\n`;
        if (ticketData.labels?.length) prompt += `**Labels:** ${ticketData.labels.join(', ')}\n`;
        prompt += `\n**Description:**\n${ticketData.description || 'No description provided.'}\n`;
        if (ticketData.acceptanceCriteria) {
            prompt += `\n**Acceptance Criteria:**\n${ticketData.acceptanceCriteria}\n`;
        }

        if (templateContent) {
            prompt += `\n---\n\n## Template Structure (Follow this format):\n${templateContent}\n`;
        } else {
            prompt += `\n---\n\nPlease use a standard test plan structure with the following sections:\n`;
            prompt += `1. Test Plan Overview\n2. Scope (In-Scope / Out-of-Scope)\n3. Test Strategy\n4. Test Scenarios\n5. Test Cases (with steps, expected results)\n6. Test Data Requirements\n7. Entry/Exit Criteria\n8. Risks and Mitigation\n`;
        }

        prompt += `\nGenerate a comprehensive test plan now.`;

        // Determine which provider to use
        const activeProvider = provider || db.prepare('SELECT value FROM settings WHERE key = ?').get('llm_provider')?.value || 'groq';

        let result;
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (activeProvider === 'ollama') {
                    result = await generateWithOllama(prompt, SYSTEM_PROMPT);
                } else {
                    result = await generateWithGroq(prompt, SYSTEM_PROMPT);
                }
                break;
            } catch (err) {
                if (attempt === MAX_RETRIES) throw err;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        // Save to history
        const insertResult = db.prepare(
            'INSERT INTO test_plans (ticket_id, ticket_summary, template_id, content, provider, model, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
            ticketData.ticketId,
            ticketData.summary,
            templateId || null,
            result.content,
            result.provider,
            result.model,
            JSON.stringify(result.metadata)
        );

        res.json({
            success: true,
            testPlan: {
                id: insertResult.lastInsertRowid,
                ticketId: ticketData.ticketId,
                ticketSummary: ticketData.summary,
                content: result.content,
                provider: result.provider,
                model: result.model,
                metadata: result.metadata,
                createdAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get generation history
router.get('/history', (req, res) => {
    try {
        const plans = db.prepare(
            'SELECT id, ticket_id, ticket_summary, provider, model, metadata_json, created_at FROM test_plans ORDER BY created_at DESC LIMIT 50'
        ).all();

        res.json({
            success: true,
            plans: plans.map(p => ({
                ...p,
                metadata: p.metadata_json ? JSON.parse(p.metadata_json) : null,
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get a single test plan
router.get('/:id', (req, res) => {
    try {
        const plan = db.prepare('SELECT * FROM test_plans WHERE id = ?').get(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Test plan not found' });
        }
        res.json({
            success: true,
            testPlan: {
                ...plan,
                metadata: plan.metadata_json ? JSON.parse(plan.metadata_json) : null,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Ollama models
router.get('/models/ollama', async (req, res) => {
    try {
        const models = await getOllamaModels();
        res.json({ success: true, models });
    } catch (err) {
        res.json({ success: false, models: [], error: err.message });
    }
});

export default router;
