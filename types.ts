
export enum FileType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  IMAGE = 'image',
  TEXT = 'text',
  OTHER = 'other'
}

export interface DocumentFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  lastModified: Date;
  path: string;
  url?: string;
  customClass: string; // La classe assignée manuellement (ex: "Rapports")
  uploadedBy?: string | null;
}

export interface LibraryState {
  documents: DocumentFile[];
  classes: string[];
  searchQuery: string;
  activeFilter: string | 'all';
}
