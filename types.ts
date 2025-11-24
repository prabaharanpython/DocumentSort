export enum DocumentType {
  AADHAAR = 'Aadhaar Card',
  VOTER_ID = 'Voter ID',
  PAN_CARD = 'PAN Card',
  CERTIFICATE = 'Certificate',
  UNKNOWN = 'Other Document'
}

export enum FolderCategory {
  IDENTITY = 'identity',
  FINANCIAL = 'financial',
  EDUCATION = 'education',
  UNCATEGORIZED = 'uncategorized'
}

// Deprecating strict Enum for categories to allow custom folders
// We keep these as default constants
export const DefaultCategories = {
  IDENTITY: FolderCategory.IDENTITY,
  FINANCIAL: FolderCategory.FINANCIAL,
  EDUCATION: FolderCategory.EDUCATION,
  UNCATEGORIZED: FolderCategory.UNCATEGORIZED
};

export interface ExtractedData {
  name?: string;
  dob?: string;
  idNumber?: string;
  address?: string;
  issueDate?: string;
  issuingAuthority?: string;
  title?: string;
  // Dynamic fields
  customFields?: Record<string, string>;
  [key: string]: any; 
}

export interface StoredDocument {
  id: string;
  userId: string; // Added owner ID
  fileName: string;
  fileType: string;
  uploadDate: number;
  docType: DocumentType | string;
  category: string;
  subFolder: string;
  extractedData: ExtractedData;
  thumbnail: string; // Base64
}

export interface FolderStructure {
  id: string;
  name: string;
  subFolders: string[];
}