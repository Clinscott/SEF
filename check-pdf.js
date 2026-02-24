const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function checkPdf() {
    const pdfPath = path.resolve(process.cwd(), 'Sef.pdf');
    const bytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const searchValues = ['18', '48', '30', '4', 'Sef', 'Amaunator'];

    fields.forEach(field => {
        let val = '';
        try {
            if (field.constructor.name === 'PDFTextField') {
                val = field.getText();
            }
        } catch (e) { }

        if (val && searchValues.includes(val)) {
            console.log(`- ${field.getName()}: "${val}"`);
        }
    });
}

checkPdf().catch(console.error);
