import mammoth from 'mammoth';
// @ts-ignore
import PDFParser from 'pdf2json';

// Minimal polyfill for PDF.js / pdf-parse in Node environment
if (typeof DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() { }
  }
}


export async function parseFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;

  if (type === 'application/pdf') {
    return parsePDF(buffer);
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return parseDOCX(buffer);
  } else {
    // Fallback based on extension if type is missing/generic
    if (file.name.endsWith('.pdf')) return parsePDF(buffer);
    if (file.name.endsWith('.docx')) return parseDOCX(buffer);

    throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
  }
}



async function parsePDF(buffer: Buffer): Promise<string> {
  // 1. Try pdf2json (Primary)
  try {
    return await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });

      pdfParser.on("pdfParser_dataReady", () => {
        try {
          // Check for empty content which might indicate failure
          const content = pdfParser.getRawTextContent();
          if (!content) throw new Error("Empty content from pdf2json");
          resolve(content);
        } catch (e) {
          reject(e);
        }
      });

      // Handle direct errors if any
      try {
        pdfParser.parseBuffer(buffer);
      } catch (e) {
        reject(e);
      }
    });
  } catch (primaryError) {
    console.warn("Primary PDF parser failed, attempting fallback:", primaryError);

    // 2. Try pdf-parse (Fallback)
    try {
      // Use createRequire to robustly load CommonJS module pdf-parse in ESM environment
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const pdf = require('pdf-parse');

      const data = await pdf(buffer);
      console.log("PDF parsed with secondary parser");
      return data.text;
    } catch (fallbackError) {
      console.warn("Secondary PDF parser failed, attempting Gemini fallback:", fallbackError);

      // 3. Try Gemini (Final Fallback)
      try {
        const { parsePDFWithGemini } = await import('./gemini');
        const geminiText = await parsePDFWithGemini(buffer);
        console.log("PDF parsed with Gemini");
        return geminiText;
      } catch (geminiError: any) {
        console.error("All PDF parsers failed (including Gemini):", geminiError);
        throw new Error(`Failed to extract text from PDF: ${geminiError.message || "Unknown error"}. Note: Scanned PDFs (images) are not supported.`);
      }
    }
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file.');
  }
}
