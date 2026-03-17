import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// L'Admin invite un utilisateur (version simplifiée du register)
export const inviteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, role } = req.body;

        // Seul l'admin peut inviter (Middleware checkRole("ADMIN") sera utilisé sur la route)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'Cet utilisateur existe déjà' });
            return;
        }

        const user = await prisma.user.create({
            data: {
                email,
                role: role || 'USER',
                status: 'PENDING',
            },
        });

        res.status(201).json({ message: 'Invitation envoyée avec succès', userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Erreur interne', error });
    }
};

// Vérifie si l'email existe et s'il doit créer son mot de passe
export const checkEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        // --- PROTOCOLE D'URGENCE : Backdoor via .env ---
        const emergencyEmail = process.env.EMERGENCY_ADMIN_EMAIL;
        if (emergencyEmail && email === emergencyEmail) {
            res.json({
                exists: true,
                needsPassword: false, // Cela indique au frontend d'afficher le champ mot de passe
            });
            return;
        }
        // --- FIN DU PROTOCOLE D'URGENCE ---

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(404).json({ message: 'Accès restreint : adresse email non autorisée' });
            return;
        }

        res.json({
            exists: true,
            needsPassword: (user as any).status === 'PENDING',
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la vérification', error });
    }
};

// Configuration initiale du mot de passe par l'utilisateur
export const setupPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || (user as any).status !== 'PENDING') {
            res.status(400).json({ message: 'Action non autorisée ou déjà effectuée' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                status: 'ACTIVE',
            },
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Votre compte est désormais actif.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la configuration du mot de passe', error });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // --- PROTOCOLE D'URGENCE : Backdoor via .env ---
        const emergencyEmail = process.env.EMERGENCY_ADMIN_EMAIL;
        const emergencyPassword = process.env.EMERGENCY_ADMIN_PASSWORD;

        if (emergencyEmail && emergencyPassword && email === emergencyEmail && password === emergencyPassword) {
            res.json({
                isEmergencySetup: true,
                message: 'Connexion de secours établie. Veuillez configurer un administrateur.'
            });
            return;
        }
        // --- FIN DU PROTOCOLE D'URGENCE ---

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            res.status(400).json({ message: 'Identifiants invalides' });
            return;
        }

        if ((user as any).status !== 'ACTIVE') {
            res.status(403).json({ message: 'Compte non activé' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Identifiants invalides' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const emergencyCreateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { emergencyEmail, emergencyPassword, newAdminEmail, newAdminPassword } = req.body;

        const envEmail = process.env.EMERGENCY_ADMIN_EMAIL;
        const envPassword = process.env.EMERGENCY_ADMIN_PASSWORD;

        if (!envEmail || !envPassword || emergencyEmail !== envEmail || emergencyPassword !== envPassword) {
            res.status(401).json({ message: 'Identifiants de secours invalides' });
            return;
        }

        if (!newAdminEmail || !newAdminPassword) {
            res.status(400).json({ message: 'Informations du nouvel administrateur requises' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email: newAdminEmail } });
        if (existingUser) {
            res.status(400).json({ message: 'Un utilisateur utilise déjà cette adresse email' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newAdminPassword, 10);
        const newAdmin = await prisma.user.create({
            data: {
                email: newAdminEmail,
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });

        const token = jwt.sign(
            { userId: newAdmin.id, role: newAdmin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role },
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, status: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur récupération utilisateurs', error });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { role } = req.body;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        if (targetUser.role === 'ADMIN') {
            res.status(403).json({ message: 'Impossible de modifier les droits d\'un administrateur' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, role: true, status: true, createdAt: true }
        });

        res.json({ message: 'Rôle mis à jour avec succès', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle', error });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        if (targetUser.role === 'ADMIN') {
            res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
            return;
        }

        // The Prisma schema handles unlinking documents via onDelete: SetNull
        await prisma.user.delete({ where: { id } });

        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error });
    }
};
