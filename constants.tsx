
import React from 'react';
import { FileType } from './types';

export const FILE_TYPE_CONFIG = {
  [FileType.PDF]: { color: 'bg-red-100 text-red-600', icon: 'fa-file-pdf', label: 'PDF' },
  [FileType.WORD]: { color: 'bg-blue-100 text-blue-600', icon: 'fa-file-word', label: 'Word' },
  [FileType.EXCEL]: { color: 'bg-green-100 text-green-600', icon: 'fa-file-excel', label: 'Excel' },
  [FileType.IMAGE]: { color: 'bg-purple-100 text-purple-600', icon: 'fa-file-image', label: 'Image' },
  [FileType.TEXT]: { color: 'bg-gray-100 text-gray-600', icon: 'fa-file-alt', label: 'Texte' },
  [FileType.OTHER]: { color: 'bg-yellow-100 text-yellow-600', icon: 'fa-file', label: 'Autre' },
};

// Suppression des fichiers fictifs comme demandé
export const MOCK_DOCUMENTS = [];
