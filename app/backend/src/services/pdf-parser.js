import fs from 'fs';

// pdf-parse has a quirky ESM import, so we handle it carefully
let pdfParse;
try {
    const mod = await import('pdf-parse/lib/pdf-parse.js');
    pdfParse = mod.default || mod;
} catch {
    // Fallback: try direct import
    const mod = await import('pdf-parse');
    pdfParse = mod.default || mod;
}

export async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return {
        text: data.text || '',
        pages: data.numpages || 0,
        info: data.info || {},
    };
}

export function parseSections(text) {
    // Extract section headers from the template text
    const lines = text.split('\n');
    const sections = [];
    const sectionPattern = /^(?:\d+[\.\)]\s*|#{1,3}\s+|[A-Z][A-Z\s]{2,}:?\s*$)/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && sectionPattern.test(trimmed)) {
            sections.push(trimmed);
        }
    }

    return sections;
}
