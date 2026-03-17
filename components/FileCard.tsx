
import React from 'react';
import { DocumentFile } from '../types';
import { FILE_TYPE_CONFIG } from '../constants';
import { formatSize } from '../utils/fileUtils';

interface FileCardProps {
  doc: DocumentFile;
  onOpen: (doc: DocumentFile) => void;
  availableClasses: string[];
  onUpdateClass: (fileId: string, newClass: string) => void;
  onRename?: (fileId: string, newName: string) => void;
  onDelete?: (fileId: string) => void;
  isAdmin: boolean;
}

const FileCard: React.FC<FileCardProps> = ({ doc, onOpen, availableClasses, onUpdateClass, onRename, onDelete, isAdmin }) => {
  const extIndex = doc.name.lastIndexOf('.');
  const nameWithoutExt = extIndex > -1 ? doc.name.slice(0, extIndex) : doc.name;
  const ext = extIndex > -1 ? doc.name.slice(extIndex) : '';

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(nameWithoutExt);

  const config = FILE_TYPE_CONFIG[doc.type];
  const isAvailable = !!doc.url;

  const handleRename = () => {
    const finalName = editName.trim() + ext;
    if (editName.trim() && finalName !== doc.name && onRename) {
      onRename(doc.id, finalName);
    } else {
      setEditName(nameWithoutExt); // Reset if empty
    }
    setIsEditing(false);
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 hover:shadow-xl transition-all duration-300 group flex flex-col h-full ${!isAvailable ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all group-hover:scale-105 duration-300 ${config.color} shadow-sm`}>
          <i className={`fas ${config.icon}`}></i>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isAvailable ? (
            <span className="text-[9px] bg-[#00843D] text-white px-2 py-1 rounded-md font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <i className="fas fa-database text-[8px]"></i> STOCKÉ
            </span>
          ) : (
            <span className="text-[9px] bg-red-500 text-white px-2 py-1 rounded-md font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <i className="fas fa-exclamation-triangle text-[8px]"></i> ERREUR
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1 gap-2">
          {isEditing ? (
            <div className="flex-grow flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#00843D] text-slate-800 font-bold"
                autoFocus
                onBlur={handleRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setIsEditing(false); setEditName(nameWithoutExt); }
                }}
              />
              <span className="text-sm font-bold text-slate-400">{ext}</span>
            </div>
          ) : (
            <h3 className="font-bold text-slate-800 truncate text-sm flex-grow" title={doc.name}>
              {doc.name}
            </h3>
          )}

          {isAdmin && !isEditing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-blue-500 transition-colors" title="Renommer">
                <i className="fas fa-edit text-xs"></i>
              </button>
              <button onClick={() => onDelete && onDelete(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Supprimer">
                <i className="fas fa-trash text-xs"></i>
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-2 mb-1" title={doc.path}>
          <i className="fas fa-folder-open opacity-40"></i>
          {doc.path}
        </p>
        {doc.uploadedBy && (
          <p className="text-[9px] text-slate-300 font-medium truncate flex items-center gap-2 mb-4" title={`Ajouté par: ${doc.uploadedBy}`}>
            <i className="fas fa-user opacity-30"></i>
            <span className="opacity-70">{doc.uploadedBy}</span>
          </p>
        )}

        <div className="mb-4">
          <label className="block text-[8px] font-black text-[#A1482F] uppercase tracking-widest mb-1.5 ml-1">Classification :</label>
          {isAdmin ? (
            <div className="relative group/select">
              <select
                value={doc.customClass}
                onChange={(e) => onUpdateClass(doc.id, e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-[#FEB813] outline-none cursor-pointer transition-all hover:bg-white"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-slate-300 pointer-events-none group-hover/select:text-[#00843D]"></i>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 flex items-center gap-2">
              <i className="fas fa-tag text-[8px] opacity-40"></i>
              {doc.customClass}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
        <span className="flex items-center gap-1.5">
          <i className="fas fa-lock text-[#FEB813]"></i>
          {formatSize(doc.size)}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="far fa-calendar-alt text-[#A1482F]"></i>
          {doc.lastModified.toLocaleDateString('fr-FR')}
        </span>
      </div>

      <button
        onClick={() => onOpen(doc)}
        disabled={!isAvailable}
        className={`mt-4 w-full py-2.5 font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 border ${isAvailable
          ? 'bg-[#00843D] text-white border-[#00843D] hover:bg-[#006b31]'
          : 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
      >
        <i className={`fas ${isAvailable ? 'fa-external-link-alt' : 'fa-ban'}`}></i>
        Consulter le document
      </button>
    </div >
  );
};

export default FileCard;
