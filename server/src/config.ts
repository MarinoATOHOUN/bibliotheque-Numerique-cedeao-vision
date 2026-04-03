import path from 'path';

// Définit le répertoire de stockage de manière dynamique
// - Si Fly.io: on utilise le volume persistant /data fourni via l'environnement
// - Sinon: on utilise le dossier de développement local ../../uploads
export const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, '../../');
export const UPLOAD_DIR = path.join(STORAGE_PATH, 'uploads');
