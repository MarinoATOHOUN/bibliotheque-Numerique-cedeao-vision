import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR } from './config';

dotenv.config();

// S'assurer que le dossier d'uploads existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Servir le Frontend statique en production
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// Pour toute autre route non-API, renvoyer l'index.html du frontend (pour le routing React)
app.use((req, res) => {
    if (req.method === 'GET' && !req.url.startsWith('/api/') && !req.url.startsWith('/uploads/')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ message: 'API route not found' });
    }
});

app.listen(Number(PORT), () => {
    console.log(`Server is running on port ${PORT}`);
});
