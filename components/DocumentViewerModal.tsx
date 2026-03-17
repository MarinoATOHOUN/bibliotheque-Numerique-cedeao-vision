import React from 'react';
import { DocumentFile, FileType } from '../types';

interface DocumentViewerModalProps {
    doc: DocumentFile | null;
    docUrl: string | null;
    onClose: () => void;
    onDownload: (doc: DocumentFile, url: string) => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ doc, docUrl, onClose, onDownload }) => {
    if (!doc || !docUrl) return null;

    const isViewable = doc.type === FileType.PDF || doc.type === FileType.IMAGE || doc.type === FileType.TEXT;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#00843D] border border-slate-100">
                            <i className={`fas ${doc.type === FileType.PDF ? 'fa-file-pdf text-red-500' : doc.type === FileType.IMAGE ? 'fa-file-image text-purple-500' : 'fa-file-alt text-slate-500'}`}></i>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="font-black text-slate-800 truncate text-sm">{doc.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.customClass}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={() => onDownload(doc, docUrl)}
                            className="bg-[#FEB813] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#e5a611] transition-colors shadow-md active:scale-95 flex items-center gap-2"
                        >
                            <i className="fas fa-download"></i> <span className="hidden sm:inline">Télécharger</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center shadow-sm"
                            title="Fermer"
                        >
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-grow bg-slate-100/50 p-4 md:p-6 overflow-hidden relative flex flex-col items-center justify-center">
                    {isViewable ? (
                        doc.type === FileType.PDF ? (
                            <iframe
                                src={docUrl}
                                className="w-full h-full rounded-2xl shadow-sm border border-slate-200 bg-white"
                                title={doc.name}
                            />
                        ) : doc.type === FileType.IMAGE ? (
                            <img
                                src={docUrl}
                                alt={doc.name}
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-sm bg-transparent"
                            />
                        ) : doc.type === FileType.TEXT ? (
                            <iframe
                                src={docUrl}
                                className="w-full h-full rounded-2xl shadow-sm border border-slate-200 bg-white p-4"
                                title={doc.name}
                            />
                        ) : null
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md w-full">
                            <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center">
                                <i className="fas fa-file-download text-5xl text-[#00843D] animate-bounce"></i>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">Aperçu non disponible</h4>
                            <p className="text-sm text-slate-500 mb-8 px-4 font-medium">L'aperçu en ligne n'est pas supporté pour les fichiers <b>{doc.type.toUpperCase()}</b>. Veuillez télécharger le document pour le consulter sur votre logiciel local.</p>
                            <button
                                onClick={() => onDownload(doc, docUrl)}
                                className="w-full bg-[#00843D] text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#006b31] transition-colors shadow-lg shadow-green-100 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <i className="fas fa-download"></i> Télécharger le fichier
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewerModal;
