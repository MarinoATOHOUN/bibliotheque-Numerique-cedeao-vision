import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, categoryName } = req.body;
        const file = req.file;
        const userId = req.user?.userId;

        if (!file || !userId) {
            res.status(400).json({ message: 'Missing file or user authentication' });
            return;
        }

        // Gérer la catégorie (créer si elle n'existe pas)
        let category = await prisma.category.findUnique({
            where: { name: categoryName || 'Autres' }
        });

        if (!category) {
            category = await prisma.category.create({
                data: { name: categoryName || 'Autres' }
            });
        }

        // Extraire un email préfixe et nombre aléatoire
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        const emailPrefix = currentUser && currentUser.email ? currentUser.email.split('@')[0] : 'user';
        const randomDigits = Math.floor(10 + Math.random() * 90); // 10 à 99

        const originalExt = path.extname(file.originalname);
        const baseName = path.basename(name || file.originalname, originalExt);

        // Exemple: "Rapport_admin_42.pdf"
        const finalDisplayName = `${baseName}_${emailPrefix}_${randomDigits}${originalExt}`;

        // Renommer physiquement le fichier sur le disque dur
        const oldPhysicalPath = path.join(__dirname, '../../uploads', file.filename);
        const newPhysicalPath = path.join(__dirname, '../../uploads', finalDisplayName);

        if (fs.existsSync(oldPhysicalPath)) {
            fs.renameSync(oldPhysicalPath, newPhysicalPath);
        }

        const document = await prisma.document.create({
            data: {
                name: finalDisplayName,
                type: originalExt.substring(1),
                size: file.size,
                path: finalDisplayName, // on sauvegarde le nouveau nom physique
                categoryId: category.id,
                ownerId: userId,
                uploadedBy: currentUser ? currentUser.email : 'Inconnu',
            },
            include: {
                category: true
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading file', error });
    }
};

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        const role = req.user?.role;

        if (role !== 'ADMIN') {
            res.status(403).json({ message: 'Seul l\'administrateur peut créer une catégorie' });
            return;
        }

        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Le nom de la catégorie est requis' });
            return;
        }

        const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
        if (existing) {
            res.json(existing); // Retourner l'existante si elle existe déjà
            return;
        }

        const category = await prisma.category.create({ data: { name: name.trim() } });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error });
    }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Tout le monde voit tous les documents par défaut
        const documents = await prisma.document.findMany({
            include: {
                category: true,
                owner: { select: { email: true } } // Ceci peut être null si contrainte de DB enlevée plus tard
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const role = req.user?.role;

        // Le rôle LECTOR ne peut pas télécharger
        if (role === 'LECTOR') {
            res.status(403).json({ message: 'Droits insuffisants pour le téléchargement (Lecteur uniquement)' });
            return;
        }

        const document = await prisma.document.findUnique({
            where: { id: id as string }
        });

        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }

        const filePath = path.join(__dirname, '../../uploads', document.path);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ message: 'File not found on disk' });
            return;
        }

        res.download(filePath, document.name);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error });
    }
};

export const updateDocumentCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { categoryName } = req.body;
        const role = req.user?.role;

        if (role !== 'ADMIN') {
            res.status(403).json({ message: 'Seul l\'administrateur peut modifier la classification des fichiers' });
            return;
        }

        // Gérer la catégorie (créer si elle n'existe pas)
        let category = await prisma.category.findUnique({
            where: { name: categoryName }
        });

        if (!category) {
            category = await prisma.category.create({
                data: { name: categoryName }
            });
        }

        const document = await prisma.document.update({
            where: { id: id as string },
            data: { categoryId: category.id },
            include: { category: true }
        });

        res.json(document);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.params;
        const role = req.user?.role;

        if (role !== 'ADMIN') {
            res.status(403).json({ message: 'Seul l\'administrateur peut supprimer une catégorie' });
            return;
        }

        if (name === 'Autres') {
            res.status(400).json({ message: 'La catégorie "Autres" ne peut pas être supprimée' });
            return;
        }

        const categoryToDelete = await prisma.category.findUnique({
            where: { name: name as string }
        });

        if (!categoryToDelete) {
            // La catégorie n'existe pas en BDD (ex: classe locale par défaut)
            // On retourne un succès pour permettre la suppression côté UI
            console.warn(`Category ${name} not found in DB - treating as already deleted`);
            res.json({ message: `Catégorie "${name}" supprimée` });
            return;
        }

        // Trouver ou créer la catégorie "Autres"
        let fallbackCategory = await prisma.category.findUnique({
            where: { name: 'Autres' }
        });

        if (!fallbackCategory) {
            fallbackCategory = await prisma.category.create({
                data: { name: 'Autres' }
            });
        }

        // Réassigner tous les documents
        const updateResult = await prisma.document.updateMany({
            where: { categoryId: categoryToDelete.id },
            data: { categoryId: fallbackCategory.id }
        });

        console.log(`Reassigned ${updateResult.count} documents from ${name} to Autres`);

        // Supprimer la catégorie
        await prisma.category.delete({
            where: { id: categoryToDelete.id }
        });

        res.json({ message: `Catégorie "${name}" supprimée et ${updateResult.count} fichiers réassignés à "Autres"` });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie', error });
    }
};

export const deleteAllDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const role = req.user?.role;

        if (role !== 'ADMIN') {
            res.status(403).json({ message: 'Seul l\'administrateur peut vider la bibliothèque' });
            return;
        }

        const documents = await prisma.document.findMany();

        // Supprimer tous les fichiers physiques
        for (const doc of documents) {
            const filePath = path.join(__dirname, '../../uploads', doc.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Vider la table des documents
        await prisma.document.deleteMany();

        res.json({ message: 'Bibliothèque vidée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error clearing library', error });
    }
};

export const renameDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user?.userId;
        const role = req.user?.role;

        const document = await prisma.document.findUnique({
            where: { id: id as string }
        });

        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }

        if (role !== 'ADMIN' && document.ownerId !== userId) {
            res.status(403).json({ message: 'Seul l\'administrateur ou le propriétaire peut renommer ce fichier' });
            return;
        }

        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Le nom du document est requis' });
            return;
        }

        const newName = name.trim();

        // Renommer le fichier physiquement sur le disque dur
        const oldPhysicalPath = path.join(__dirname, '../../uploads', document.path);
        const newPhysicalPath = path.join(__dirname, '../../uploads', newName);

        if (fs.existsSync(oldPhysicalPath) && oldPhysicalPath !== newPhysicalPath) {
            fs.renameSync(oldPhysicalPath, newPhysicalPath);
        }

        const updatedDocument = await prisma.document.update({
            where: { id: id as string },
            data: {
                name: newName,
                path: newName // on met à jour le chemin physique dans la base aussi
            },
            include: { category: true }
        });

        res.json(updatedDocument);
    } catch (error) {
        res.status(500).json({ message: 'Error renaming document', error });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const role = req.user?.role;

        const document = await prisma.document.findUnique({
            where: { id: id as string }
        });

        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }

        // Seul l'admin ou le propriétaire peut supprimer
        if (role !== 'ADMIN' && document.ownerId !== userId) {
            res.status(403).json({ message: 'Seul l\'administrateur ou le propriétaire peut supprimer ce fichier' });
            return;
        }

        // Supprimer le fichier physique
        const filePath = path.join(__dirname, '../../uploads', document.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.document.delete({ where: { id: id as string } });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error });
    }
};
