import { Router } from 'express';
import { uploadFile, getDocuments, deleteDocument, downloadDocument, updateDocumentCategory, deleteAllDocuments, deleteCategory, getCategories, createCategory, renameDocument } from '../controllers/documentController';
import { authenticateToken, checkRole } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.use(authenticateToken); // Toutes les routes de documents nécessitent une authentification

router.post('/upload', checkRole(['ADMIN']), upload.single('file'), uploadFile);
router.get('/', getDocuments);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/download/:id', downloadDocument);
router.patch('/:id/category', updateDocumentCategory);
router.patch('/:id/name', renameDocument);
router.delete('/category/:name', deleteCategory);
router.delete('/:id', deleteDocument);
router.delete('/', deleteAllDocuments);

export default router;
