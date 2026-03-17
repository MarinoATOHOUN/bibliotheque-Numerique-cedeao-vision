
import { FileType } from '../types';

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileTypeFromExtension = (filename: string): FileType => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return FileType.PDF;
    case 'doc':
    case 'docx': return FileType.WORD;
    case 'xls':
    case 'xlsx':
    case 'csv': return FileType.EXCEL;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp': return FileType.IMAGE;
    case 'txt':
    case 'md': return FileType.TEXT;
    default: return FileType.OTHER;
  }
};
