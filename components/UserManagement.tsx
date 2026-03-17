import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const UserManagement: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Erreur chargement utilisateurs', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            await api.post('/auth/invite', { email, role });
            setMessage('Invitation envoyée avec succès');
            setEmail('');
            fetchUsers();
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Erreur lors de l\'invitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await api.put(`/auth/users/${id}/role`, { role: newRole });
            fetchUsers();
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchUsers();
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-auto overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-300">
                <div className="h-2 cedeao-gradient w-full"></div>

                <div className="p-5 sm:p-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                <span className="w-2 h-8 bg-[#FEB813] rounded-full"></span>
                                Gestion d'Accès
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inviter de nouveaux collaborateurs</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <form onSubmit={handleInvite} className="bg-slate-50 p-4 sm:p-6 rounded-3xl border border-slate-100 mb-8">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email du collaborateur</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nom@cedeao.int"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="w-full sm:flex-grow">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Rôle / Droits</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#00843D] outline-none"
                                    >
                                        <option value="USER">Utilisateur standard</option>
                                        <option value="LECTOR">Lecteur uniquement</option>
                                        <option value="ADMIN">Administrateur</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto bg-[#00843D] text-white h-[42px] px-6 rounded-xl hover:bg-[#006b31] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                                    <span className="text-[10px] font-black uppercase tracking-widest">Inviter</span>
                                </button>
                            </div>
                        </div>
                        {message && (
                            <p className={`mt-3 text-[10px] font-black uppercase tracking-wider text-center ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
                                {message}
                            </p>
                        )}
                    </form>

                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fas fa-list-ul"></i>
                        Liste des accès configurés
                    </h3>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {users.map((u) => (
                            <div key={u.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-[#00843D]/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#00843D]/10 group-hover:text-[#00843D] transition-all">
                                        <i className="fas fa-user text-xs"></i>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-none">{u.email}</span>
                                        {u.role === 'ADMIN' ? (
                                            <span className="text-[8px] font-black uppercase tracking-widest w-fit px-1.5 rounded-full bg-red-50 text-[#A1482F] mt-1">ADMIN</span>
                                        ) : (
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-[#00843D] mt-1 cursor-pointer w-fit"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="LECTOR">LECTOR</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                        {u.status === 'ACTIVE' ? 'Activé' : 'En attente'}
                                    </span>
                                    <span className="text-[10px] text-slate-300 font-medium whitespace-nowrap">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </span>
                                    {u.role !== 'ADMIN' && (
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-400 hover:text-red-600 ml-2"
                                            title="Supprimer l'utilisateur"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
