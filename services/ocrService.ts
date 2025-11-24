import Tesseract from 'tesseract.js';
import { DocumentType, FolderCategory, ExtractedData } from '../types';

export const analyzeDocument = async (base64Data: string, mimeType: string) => {
    const imageSrc = `data:${mimeType};base64,${base64Data}`;
    
    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
        logger: m => console.log('[OCR]', m.status, m.progress)
    });

    console.log("Raw OCR Text:", text);
    
    return processOcrText(text);
};

const processOcrText = (text: string) => {
    // Normalization
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fullText = text.toUpperCase().replace(/\s+/g, ' '); // Normalized single line for keyword search

    let docType = DocumentType.UNKNOWN;
    let category = FolderCategory.UNCATEGORIZED;
    let subFolder = 'uncategorized';
    let extractedData: ExtractedData = {};

    // --- 1. Detect Document Type ---
    
    // PAN Card Detection
    if (fullText.includes("INCOME TAX") || (fullText.includes("PERMANENT") && fullText.includes("ACCOUNT"))) {
        docType = DocumentType.PAN_CARD;
        category = FolderCategory.FINANCIAL;
        subFolder = 'pan';
    } 
    // Voter ID Detection
    else if (fullText.includes("ELECTION COMMISSION") || fullText.includes("ELECTOR") || fullText.includes("EPIC")) {
        docType = DocumentType.VOTER_ID;
        category = FolderCategory.IDENTITY;
        subFolder = 'voter';
    } 
    // Aadhaar Detection
    else if (fullText.includes("AADHAAR") || fullText.includes("UNIQUE IDENTIFICATION") || /\d{4}\s\d{4}\s\d{4}/.test(fullText)) {
        docType = DocumentType.AADHAAR;
        category = FolderCategory.IDENTITY;
        subFolder = 'aadhaar';
    } 
    // Certificate Detection (Generic)
    else if (fullText.includes("CERTIFICATE") || fullText.includes("UNIVERSITY") || fullText.includes("DEGREE") || fullText.includes("MARKSHEET")) {
        docType = DocumentType.CERTIFICATE;
        category = FolderCategory.EDUCATION;
        subFolder = 'certificates';
        extractedData.title = "Certificate";
    }

    // --- 2. Extract Fields based on heuristics ---
    
    // Common Regex Patterns
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
    const dateRegex = /\d{2}[\/\-]\d{2}[\/\-]\d{4}/;
    const yearRegex = /[\-]\d{4}/;
    
    // Attempt to find Date of Birth anywhere
    const dobMatch = fullText.match(dateRegex);
    if (dobMatch) extractedData.dob = dobMatch[0];

    if (docType === DocumentType.PAN_CARD) {
        // Extract PAN
        const panMatch = fullText.match(panRegex);
        if (panMatch) extractedData.idNumber = panMatch[0];
        
        // Name Heuristic for PAN:
        // Usually 2nd or 3rd line. Look for a line that matches name pattern (All caps, no numbers, not a keyword)
        for (const line of lines) {
             const up = line.toUpperCase();
             if (up.includes("INCOME") || up.includes("INDIA") || up.includes("GOVT") || up.includes("ACCOUNT") || up.includes("NUMBER")) continue;
             // Check if mostly letters
             if (/^[A-Z\s\.]+$/.test(up) && up.length > 4) {
                 extractedData.name = line;
                 break;
             }
        }
    } 
    else if (docType === DocumentType.AADHAAR) {
        // Extract Aadhaar Number
        const uidMatch = fullText.match(/\d{4}\s\d{4}\s\d{4}/);
        if (uidMatch) extractedData.idNumber = uidMatch[0];
        
        // Specific DOB pattern for Aadhaar
        const aadhaarDob = text.match(/DOB\s*[:\-\.]?\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (aadhaarDob) extractedData.dob = aadhaarDob[1];
        else {
             const yobMatch = text.match(/Year of Birth\s*[:\-\.]?\s*(\d{4})/i);
             if (yobMatch) extractedData.dob = yobMatch[1];
        }

        // Address is complex in OCR, often detected by "Address:"
        const addrIndex = lines.findIndex(l => l.toUpperCase().includes("ADDRESS"));
        if (addrIndex !== -1 && addrIndex + 1 < lines.length) {
            extractedData.address = lines.slice(addrIndex + 1, addrIndex + 3).join(", ");
        }
    }
    else if (docType === DocumentType.VOTER_ID) {
         // Extract EPIC Number (Standard format: 3 chars + 7 digits, but varies)
         const epicRegex = /[A-Z]{3}[0-9]{7}/;
         const epicMatch = fullText.match(epicRegex);
         if (epicMatch) extractedData.idNumber = epicMatch[0];
         
         // Name often follows "Name"
         const nameLine = lines.find(l => l.toUpperCase().startsWith("NAME"));
         if (nameLine) extractedData.name = nameLine.replace(/NAME\s*[:\-\.]\s*/i, "").trim();
    }
    else if (docType === DocumentType.CERTIFICATE) {
        // Try to find University name
        const uniLine = lines.find(l => l.toUpperCase().includes("UNIVERSITY") || l.toUpperCase().includes("INSTITUTE"));
        if (uniLine) extractedData.issuingAuthority = uniLine;
    }

    return { docType, category, subFolder, extractedData };
}
