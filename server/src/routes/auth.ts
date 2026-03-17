import { Router } from 'express';
import { login, inviteUser, checkEmail, setupPassword, getUsers, updateUserRole, deleteUser, emergencyCreateAdmin } from '../controllers/authController';
import { authenticateToken, checkRole } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/check-email', checkEmail);
router.post('/setup-password', setupPassword);
router.post('/emergency-create-admin', emergencyCreateAdmin);

// Routes admin
router.post('/invite', authenticateToken, checkRole(['ADMIN']), inviteUser);
router.get('/users', authenticateToken, checkRole(['ADMIN']), getUsers);
router.put('/users/:id/role', authenticateToken, checkRole(['ADMIN']), updateUserRole);
router.delete('/users/:id', authenticateToken, checkRole(['ADMIN']), deleteUser);

export default router;
