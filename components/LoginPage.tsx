import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import logo from '../CEDEAO.png';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'email' | 'login' | 'setup' | 'emergency_create'>('email');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/check-email', { email });
            if (response.data.needsPassword) {
                setStep('setup');
            } else {
                setStep('login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Accès restreint : adresse email non autorisée');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.isEmergencySetup) {
                setStep('emergency_create');
                setSuccess(response.data.message);
            } else {
                login(response.data.token, response.data.user);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Mot de passe incorrect');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/setup-password', { email, password });
            setSuccess('Félicitations ! Votre accès est activé. Redirection...');

            // Connexion automatique après la création du mot de passe
            setTimeout(() => {
                login(response.data.token, response.data.user);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmergencyCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAdminPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/emergency-create-admin', {
                emergencyEmail: email,
                emergencyPassword: password,
                newAdminEmail,
                newAdminPassword
            });
            setSuccess('Compte administrateur créé avec succès ! Connectez-vous avec ce nouveau compte.');
            setTimeout(() => {
                // Déconnexion logique : on vide le formulaire et on retourne à l'étape initiale
                setEmail('');
                setPassword('');
                setNewAdminEmail('');
                setNewAdminPassword('');
                setConfirmPassword('');
                setStep('email');
            }, 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création du compte');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
                <div className="h-2 cedeao-gradient w-full"></div>
                <div className="p-8 sm:p-12">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-6">
                            <img src={logo} alt="CEDEAO Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-[#00843D] text-center tracking-tighter uppercase leading-none">
                            {step === 'email' ? 'Identification' : step === 'setup' ? 'Premier Accès' : 'Connexion'}
                        </h1>
                        <p className="text-[10px] text-[#A1482F] font-bold tracking-widest uppercase mt-2">
                            Bibliothèque Numérique Vision 2050
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-black p-4 rounded-xl flex items-center gap-3 mb-6 uppercase tracking-wider">
                            <i className="fas fa-exclamation-circle text-sm"></i>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-100 text-green-600 text-[10px] font-black p-4 rounded-xl flex items-center gap-3 mb-6 uppercase tracking-wider">
                            <i className="fas fa-check-circle text-sm"></i>
                            {success}
                        </div>
                    )}

                    {step === 'email' && (
                        <form onSubmit={handleCheckEmail} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                    Adresse Email Institutionnelle
                                </label>
                                <div className="relative">
                                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent transition-all outline-none"
                                        placeholder="votre@email.int"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#00843D] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-[#006b31] transition-all shadow-lg shadow-green-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-arrow-right"></i>}
                                Continuer
                            </button>
                        </form>
                    )}

                    {step === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="bg-[#00843D]/10 p-3 rounded-2xl border border-[#00843D]/20 flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-[#00843D] flex items-center justify-center text-white shadow-sm">
                                    <i className="fas fa-check text-[10px]"></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-[#00843D] uppercase tracking-widest">Email validé</span>
                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{email}</span>
                                </div>
                                <button type="button" onClick={() => setStep('email')} className="ml-auto text-[9px] font-black text-[#A1482F] uppercase hover:underline p-2">Changer</button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                    Mot de Passe
                                </label>
                                <div className="relative">
                                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#00843D] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-[#006b31] transition-all shadow-lg shadow-green-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-alt"></i>}
                                Se Connecter
                            </button>
                        </form>
                    )}

                    {step === 'setup' && (
                        <form onSubmit={handleSetupPassword} className="space-y-6">
                            <div className="bg-[#00843D]/10 p-3 rounded-2xl border border-[#00843D]/20 flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-[#00843D] flex items-center justify-center text-white shadow-sm">
                                    <i className="fas fa-check text-[10px]"></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-[#00843D] uppercase tracking-widest">Email validé</span>
                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{email}</span>
                                </div>
                                <button type="button" onClick={() => setStep('email')} className="ml-auto text-[9px] font-black text-[#A1482F] uppercase hover:underline p-2">Changer</button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                        Nouveau Mot de Passe
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                        Confirmer le Mot de Passe
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-check-double absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#00843D] focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#FEB813] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-[#e5a611] transition-all shadow-lg shadow-yellow-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                Activer mon compte
                            </button>
                        </form>
                    )}

                    {step === 'emergency_create' && (
                        <form onSubmit={handleEmergencyCreate} className="space-y-6">
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex flex-col gap-2 mb-6 shadow-sm">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-exclamation-triangle"></i> Accès d'urgence
                                </span>
                                <p className="text-xs text-red-800 font-medium">
                                    Cet accès est temporaire. Vous devez obligatoirement créer un compte Administrateur nominatif pour continuer. <br /><br /><b>L'e-mail de secours ne sera pas enregistré dans l'application.</b>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                        Adresse Email du Nouvel Admin
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all outline-none"
                                            placeholder="admin.definitif@cedeao.int"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                        Mot de Passe Définitif
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="password"
                                            value={newAdminPassword}
                                            onChange={(e) => setNewAdminPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                        Confirmer le Mot de Passe
                                    </label>
                                    <div className="relative">
                                        <i className="fas fa-check-double absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#A1482F] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-[#853923] transition-all shadow-lg shadow-red-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-shield"></i>}
                                Créer l'Administrateur
                            </button>
                        </form>
                    )}

                    <p className="text-center mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © 2026 CEDEAO BENIN - Protection des Données
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
