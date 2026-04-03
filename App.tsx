
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentFile, FileType } from './types';
import { getFileTypeFromExtension } from './utils/fileUtils';
import FileCard from './components/FileCard';
import Sidebar from './components/Sidebar';
import { saveFileToDB, getAllFilesFromDB, clearAllFilesFromDB, deleteFileFromDB } from './utils/db';
import LoginPage from './components/LoginPage';
import UserManagement from './components/UserManagement';
import ConfirmModal from './components/ConfirmModal';
import DocumentViewerModal from './components/DocumentViewerModal';
import { useAuth } from './utils/AuthContext';
import api from './utils/api';

const STORAGE_KEY = 'cedeao_vision2050_library_metadata';

import logo from './CEDEAO.png';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DocumentFile | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  // Chargement initial depuis l'API
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setIsSyncing(true);
        try {
          const response = await api.get('/documents');
          const formattedDocs = response.data.map((doc: any) => ({
            ...doc,
            lastModified: new Date(doc.createdAt),
            type: getFileTypeFromExtension(doc.name),
            customClass: doc.category.name,
            uploadedBy: doc.uploadedBy || (doc.owner?.email) || null,
            url: `${(import.meta as any).env.PROD ? '' : 'http://localhost:5000'}/api/documents/download/${doc.id}`
          }));
          setDocuments(formattedDocs);

          // Charger les catégories depuis l'API
          const catResponse = await api.get('/documents/categories');
          const serverCategories: string[] = catResponse.data.map((c: any) => c.name);

          // Fusionner avec les catégories issues des documents (au cas où)
          const docCategories = formattedDocs.map((d: any) => d.customClass);
          const allCategories = Array.from(new Set([...serverCategories, ...docCategories, 'Autres']));
          setClasses(allCategories.sort());
        } catch (e) {
          console.error("Erreur de récupération des documents", e);
        }
        setIsInitialLoad(false);
        setIsSyncing(false);
      };
      loadData();
    }
  }, [isAuthenticated]);

  // Sauvegarde auto des métadonnées uniquement
  useEffect(() => {
    if (!isInitialLoad) {
      const docsMeta = documents.map(({ url, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docsMeta));
    }
  }, [documents, isInitialLoad]);

  const handleDirectoryImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsSyncing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryName', 'Autres');
      formData.append('name', file.name);

      try {
        const response = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const newDoc = {
          ...response.data,
          lastModified: new Date(response.data.createdAt),
          type: getFileTypeFromExtension(response.data.name),
          customClass: response.data.category.name,
          uploadedBy: response.data.uploadedBy || null,
          url: `${(import.meta as any).env.PROD ? '' : 'http://localhost:5000'}/api/documents/download/${response.data.id}`
        };
        setDocuments(prev => [...prev, newDoc]);
      } catch (e) {
        console.error("Erreur lors de l'upload", e);
      }
    }

    setIsSyncing(false);
    event.target.value = '';
  }, []);

  const handleUpdateFileClass = useCallback(async (fileId: string, newClass: string) => {
    try {
      await api.patch(`/documents/${fileId}/category`, { categoryName: newClass });
      setDocuments(prev => prev.map(doc =>
        doc.id === fileId ? { ...doc, customClass: newClass } : doc
      ));
    } catch (e) {
      console.error("Erreur lors de la mise à jour de la catégorie", e);
      alert("Erreur : Impossible de modifier la classification.");
    }
  }, []);

  const handleRenameDocument = useCallback(async (fileId: string, newName: string) => {
    try {
      await api.patch(`/documents/${fileId}/name`, { name: newName });
      setDocuments(prev => prev.map(doc =>
        doc.id === fileId ? { ...doc, name: newName } : doc
      ));
    } catch (e: any) {
      console.error("Erreur lors du renommage", e);
      alert(e.response?.data?.message || "Erreur lors du renommage du document.");
    }
  }, []);

  const handleDeleteDocument = useCallback(async (fileId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    try {
      await api.delete(`/documents/${fileId}`);
      setDocuments(prev => prev.filter(doc => doc.id !== fileId));
    } catch (e: any) {
      console.error("Erreur lors de la suppression", e);
      alert(e.response?.data?.message || "Erreur lors de la suppression du document.");
    }
  }, []);

  const handleAddClass = useCallback(async (className: string) => {
    const trimmed = className.trim();
    if (!trimmed || classes.includes(trimmed)) return;

    try {
      // Persister la catégorie en base de données
      await api.post('/documents/categories', { name: trimmed });
      setClasses(prev => [...prev, trimmed].sort());
    } catch (e: any) {
      console.error("Erreur lors de la création de la classe", e);
      alert(e.response?.data?.message || "Erreur lors de la création de la classe.");
    }
  }, [classes]);

  const handleDeleteClass = useCallback((className: string) => {
    if (user?.role !== 'ADMIN') return;
    setCategoryToDelete(className);
    setShowCategoryDeleteConfirm(true);
  }, [user]);

  const executeDeleteClass = async () => {
    if (!categoryToDelete) return;

    try {
      await api.delete(`/documents/category/${categoryToDelete}`);

      setClasses(prev => prev.filter(c => c !== categoryToDelete));
      setDocuments(prev => prev.map(doc =>
        doc.customClass === categoryToDelete ? { ...doc, customClass: "Autres" } : doc
      ));

      if (activeFilter === categoryToDelete) setActiveFilter('all');
    } catch (e: any) {
      console.error("Erreur lors de la suppression de la classe", e);
      // On nettoie quand même l'UI (la catégorie n'existe peut-être pas en BDD)
      setClasses(prev => prev.filter(c => c !== categoryToDelete));
      setDocuments(prev => prev.map(doc =>
        doc.customClass === categoryToDelete ? { ...doc, customClass: "Autres" } : doc
      ));
      if (activeFilter === categoryToDelete) setActiveFilter('all');
    } finally {
      setCategoryToDelete(null);
    }
  };

  const handleClearLibrary = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    setShowClearConfirm(true);
  }, [user]);

  const executeClearLibrary = async () => {
    try {
      setIsSyncing(true);
      await api.delete('/documents');
      setDocuments([]);
      localStorage.removeItem(STORAGE_KEY);
      await clearAllFilesFromDB();
    } catch (e: any) {
      console.error("Erreur lors de la suppression totale", e);
      alert(e.response?.data?.message || "Erreur lors de la suppression de la bibliothèque.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || doc.customClass === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    documents.forEach(doc => {
      result[doc.customClass] = (result[doc.customClass] || 0) + 1;
    });
    return result;
  }, [documents]);

  const handleOpenFile = async (doc: DocumentFile) => {
    try {
      // Afficher un "loading" si on veut ?
      const response = await api.get(`/documents/download/${doc.id}`, {
        responseType: 'blob'
      });

      // Essayer de deviner le vrai type mime pour l'affichage inline
      let mimeType = 'application/octet-stream';
      if (doc.type === FileType.PDF) mimeType = 'application/pdf';
      else if (doc.type === FileType.IMAGE) {
        if (doc.name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.name.toLowerCase().match(/\.(jpg|jpeg)$/)) mimeType = 'image/jpeg';
        else mimeType = 'image/*';
      }
      else if (doc.type === FileType.TEXT) mimeType = 'text/plain';

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      setViewingDoc(doc);
      setViewingUrl(url);
    } catch (e: any) {
      if (e.response && e.response.status === 403) {
        alert(e.response.data.message || "Accès refusé pour ce fichier.");
      } else {
        alert("Erreur lors du chargement du fichier.");
      }
    }
  };

  const handleDownloadFile = (doc: DocumentFile, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCloseViewer = () => {
    if (viewingUrl) window.URL.revokeObjectURL(viewingUrl);
    setViewingDoc(null);
    setViewingUrl(null);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-1.5 cedeao-gradient w-full"></div>

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[50] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="CEDEAO Logo"
                className={`w-full h-full object-contain ${isSyncing ? 'animate-pulse' : ''}`}
              />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg md:text-xl font-black text-[#00843D] leading-none uppercase tracking-tighter">REPRESENTATION DE LA CEDEAO AU BENIN</h1>
              <p className="text-[9px] md:text-[10px] text-[#A1482F] font-bold tracking-widest uppercase mt-0.5">Bibliothèque Numérique</p>
            </div>
            <div className="lg:hidden">
              <h1 className="text-sm font-black text-[#00843D] leading-none uppercase tracking-tighter">CEDEAO BENIN</h1>
              <p className="text-[8px] text-[#A1482F] font-bold tracking-widest uppercase">Bibliothèque</p>
            </div>
          </div>

          <div className="flex-grow max-w-xl hidden md:block">
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00843D] transition-colors"></i>
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent transition-all outline-none text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 text-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connecté</span>
              <span className="text-[10px] font-black text-[#00843D] uppercase truncate max-w-[120px]">{user?.email}</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowUserMgmt(true)}
                  className="w-10 h-10 flex items-center justify-center bg-[#FEB813] text-white rounded-xl"
                  title="Accès"
                >
                  <i className="fas fa-users-cog"></i>
                </button>
              )}

              {user?.role === 'ADMIN' && (
                <label className="flex items-center gap-2 px-4 py-2.5 bg-[#00843D] text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-lg active:scale-95">
                  <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                  <span>Importer</span>
                  <input type="file" className="hidden" multiple onChange={handleDirectoryImport} />
                </label>
              )}

              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:text-red-500 transition-all"
              >
                <i className="fas fa-power-off"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase">{user?.email}</span>
              <button onClick={logout} className="text-red-500 font-bold text-xs uppercase">Déconnexion</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {user?.role === 'ADMIN' && (
                <button onClick={() => setShowUserMgmt(true)} className="flex items-center justify-center gap-2 p-3 bg-[#FEB813] text-white rounded-xl text-[10px] font-black uppercase">
                  <i className="fas fa-users-cog"></i> Gérer Accès
                </button>
              )}
              {user?.role === 'ADMIN' && (
                <label className="flex items-center justify-center gap-2 p-3 bg-[#00843D] text-white rounded-xl text-[10px] font-black uppercase">
                  <i className="fas fa-plus"></i> Importer
                  <input type="file" className="hidden" multiple onChange={handleDirectoryImport} />
                </label>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 w-full relative">
        {/* Mobile Filter Toggle */}
        <button
          className="md:hidden w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-[#A1482F] font-black uppercase tracking-widest text-xs mb-4"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="flex items-center gap-2">
            <i className={`fas ${isSidebarOpen ? 'fa-chevron-up' : 'fa-filter'}`}></i>
            {isSidebarOpen ? 'Masquer les filtres' : 'Afficher les filtres & classes'}
          </span>
          <span className="bg-[#A1482F]/10 text-[#A1482F] px-2 py-1 rounded-lg text-[9px]">
            {Object.keys(counts).length}
          </span>
        </button>

        <div className={`md:block ${isSidebarOpen ? 'block' : 'hidden'} transition-all duration-300 md:w-64 flex-shrink-0`}>
          <Sidebar
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              setIsSidebarOpen(false); // Close on selection on mobile
            }}
            counts={counts}
            classes={classes}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            onClear={handleClearLibrary}
            onImport={handleDirectoryImport}
            isAdmin={user?.role === 'ADMIN'}
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-8 bg-white/90 p-4 rounded-2xl border border-white/80 backdrop-blur-sm shadow-sm">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-[#FEB813] rounded-full"></span>
              {activeFilter === 'all' ? 'Archives Complètes' : `Classe : ${activeFilter}`}
              <span className="text-[10px] font-black text-[#00843D] bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-wider">
                {filteredDocuments.length} Documents stockés
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-[#A1482F] font-black uppercase tracking-widest">
              <i className="fas fa-database"></i>
              <span>Stockage local actif</span>
            </div>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map(doc => (
                <FileCard
                  key={doc.id}
                  doc={doc}
                  onOpen={handleOpenFile}
                  availableClasses={classes}
                  onUpdateClass={handleUpdateFileClass}
                  onRename={handleRenameDocument}
                  onDelete={handleDeleteDocument}
                  isAdmin={user?.role === 'ADMIN'}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-300 shadow-xl">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#FEB813] text-3xl mb-6 shadow-inner border border-slate-100">
                <i className={`fas ${searchQuery || activeFilter !== 'all' ? 'fa-search' : 'fa-hdd'}`}></i>
              </div>
              <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight">
                {searchQuery || activeFilter !== 'all' ? 'Aucun résultat' : 'Votre coffre est vide'}
              </h3>
              <p className="text-slate-500 text-[11px] max-w-sm text-center mt-3 font-bold uppercase tracking-wider">
                Les fichiers importés ici resteront accessibles même si vous fermez votre navigateur.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white/95 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <p>© 2026 REPRESENTATION DE LA CEDEAO AU BENIN - Archivage Permanent</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <span className="flex items-center gap-2 text-[#00843D]"><i className="fas fa-check-double"></i> Données Persistantes</span>
            <span className="flex items-center gap-2"><i className="fas fa-shield-alt text-[#FEB813]"></i> Vision 2050</span>
          </div>
        </div>
      </footer>

      {showUserMgmt && <UserManagement onClose={() => setShowUserMgmt(false)} />}

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={executeClearLibrary}
        title="Vider la Bibliothèque"
        message="Attention : Vous êtes sur le point de supprimer TOUS les fichiers de la bibliothèque. Cette action est irréversible et affectera tous les utilisateurs."
        confirmLabel="Tout Supprimer"
        cancelLabel="Annuler"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={showCategoryDeleteConfirm}
        onClose={() => setShowCategoryDeleteConfirm(false)}
        onConfirm={executeDeleteClass}
        title="Supprimer la classe"
        message={`Voulez-vous vraiment supprimer la classe "${categoryToDelete}" ? Tous les fichiers associés seront déplacés vers "Autres".`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDanger={true}
      />

      <DocumentViewerModal
        doc={viewingDoc}
        docUrl={viewingUrl}
        onClose={handleCloseViewer}
        onDownload={handleDownloadFile}
      />
    </div>
  );
};

export default App;
