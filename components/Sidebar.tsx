
import React, { useState } from 'react';
import logo from '../CEDEAO.png';

interface SidebarProps {
  activeFilter: string | 'all';
  onFilterChange: (filter: string | 'all') => void;
  counts: Record<string, number>;
  classes: string[];
  onAddClass: (name: string) => void;
  onDeleteClass: (name: string) => void;
  onClear: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeFilter, onFilterChange, counts, classes, onAddClass, onDeleteClass, onClear, onImport, isAdmin
}) => {
  const [newClassName, setNewClassName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      onAddClass(newClassName.trim());
      setNewClassName('');
    }
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm p-5 rounded-[2rem] border border-white/60 shadow-xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] font-black text-[#A1482F] uppercase tracking-[0.2em]">
            <span>Classes</span>
          </h2>
          {isAdmin && (
            <button
              onClick={onClear}
              className="text-[#A1482F] hover:text-red-600 transition-colors"
              title="Vider la bibliothèque"
            >
              <i className="fas fa-trash-alt text-[10px]"></i>
            </button>
          )}
        </div>

        <nav className="space-y-2 mb-6">
          <button
            onClick={() => onFilterChange('all')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold transition-all relative overflow-hidden group ${activeFilter === 'all'
              ? 'bg-[#00843D] text-white shadow-lg shadow-green-100'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <div className="flex items-center gap-3 relative z-10 text-left">
              <i className="fas fa-layer-group w-4 text-center"></i>
              <span>Toutes les archives</span>
            </div>
            <span className={`relative z-10 text-[10px] min-w-[24px] text-center px-1.5 py-0.5 rounded-lg ${activeFilter === 'all' ? 'bg-black/10' : 'bg-slate-200 text-slate-500'}`}>
              {/* Fix: Explicitly type reduce parameters to avoid 'unknown' type error */}
              {Object.values(counts).reduce((a: number, b: number) => a + b, 0)}
            </span>
          </button>

          <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {classes.map((cls) => (
              <div key={cls} className="group flex items-center gap-1">
                <button
                  onClick={() => onFilterChange(cls)}
                  className={`flex-grow flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold transition-all ${activeFilter === cls
                    ? 'bg-[#A1482F] text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className="fas fa-tag w-4 text-center opacity-40"></i>
                    <span className="truncate">{cls}</span>
                  </div>
                  <span className={`text-[10px] min-w-[24px] text-center px-1.5 py-0.5 rounded-lg ${activeFilter === cls ? 'bg-black/10' : 'bg-slate-200 text-slate-500'}`}>
                    {counts[cls] || 0}
                  </span>
                </button>
                {isAdmin && cls !== "Autres" && (
                  <button
                    onClick={() => onDeleteClass(cls)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </nav>

        <form onSubmit={handleAdd} className="pt-4 border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Nouvelle classe..."
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-[10px] font-bold outline-none focus:border-[#00843D] transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#00843D] text-white rounded-lg flex items-center justify-center hover:bg-green-700"
            >
              <i className="fas fa-plus text-[10px]"></i>
            </button>
          </div>
        </form>
      </div>

      {isAdmin && (
        <div className="p-6 bg-[#00843D] rounded-[2rem] border border-green-700 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center shrink-0">
              <img src={logo} alt="CEDEAO" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              Mise à jour Vision
            </h3>
          </div>
          <p className="text-white/80 text-[10px] mb-5 leading-relaxed font-medium">
            Assurez la continuité de la Vision 2050 en ré-indexant vos dossiers.
          </p>
          <label className="block w-full text-center py-3 px-4 bg-white text-[#00843D] text-[10px] font-black uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-md active:scale-95 border border-white">
            Rafraîchir Dossier
            <input
              type="file"
              className="hidden"
              webkitdirectory="true"
              directory=""
              multiple
              onChange={onImport}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
