import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-300">
                <div className={`h-2 w-full ${isDanger ? 'bg-red-500' : 'cedeao-gradient'}`}></div>

                <div className="p-8 sm:p-10 text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-green-50 text-[#00843D]'}`}>
                        <i className={`fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-2xl`}></i>
                    </div>

                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
                        {title}
                    </h2>

                    <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-3.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-[#00843D] hover:bg-[#006b31] shadow-green-100'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
