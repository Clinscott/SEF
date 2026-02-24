import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function dumpFields() {
    const pdfPath = resolve(process.cwd(), 'Sef.pdf');
    console.log(`[Utility] Loading ${pdfPath} to dump fields...`);

    const existingPdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`Found ${fields.length} fields:`);
    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`- [${type}] ${name}`);
    });
}

dumpFields().catch(console.error);
