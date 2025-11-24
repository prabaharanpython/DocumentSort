import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DocumentType, ExtractedData, FolderCategory } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert Document Analysis AI. Your job is to analyze images of documents (Aadhaar, PAN, Voter ID, Certificates) and extract structured data.

1. Identify the Document Type strictly from this list: "Aadhaar Card", "Voter ID", "PAN Card", "Certificate". If none match, use "Other Document".
2. Based on the type, extract the following fields if visible:
   - Aadhaar: Name, Aadhaar Number (idNumber), DOB, Address
   - Voter ID: Name, EPIC Number (idNumber), Address
   - PAN: Name, PAN Number (idNumber), DOB
   - Certificate: Title, Issuing Authority, Issue Date
3. Suggest a Folder Category: "identity", "financial", "education".
4. Suggest a Sub Folder name (lowercase, e.g., 'aadhaar', 'pan').
`;

// Define the response schema
const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    docType: { type: Type.STRING, enum: [
      DocumentType.AADHAAR, DocumentType.VOTER_ID, DocumentType.PAN_CARD, DocumentType.CERTIFICATE, DocumentType.UNKNOWN
    ] },
    category: { type: Type.STRING, enum: [
      FolderCategory.IDENTITY, FolderCategory.FINANCIAL, FolderCategory.EDUCATION, FolderCategory.UNCATEGORIZED
    ] },
    subFolder: { type: Type.STRING },
    extractedData: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        dob: { type: Type.STRING },
        idNumber: { type: Type.STRING },
        address: { type: Type.STRING },
        issueDate: { type: Type.STRING },
        issuingAuthority: { type: Type.STRING },
        title: { type: Type.STRING },
      }
    }
  },
  required: ["docType", "category", "subFolder", "extractedData"]
};

export const analyzeDocument = async (base64Data: string, mimeType: string) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this document image. Extract all text and classify it."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.1 // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
