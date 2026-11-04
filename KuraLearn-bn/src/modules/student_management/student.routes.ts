import { Router } from 'express';
import { StudentController } from './student.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN", "SUPER_ADMIN", "HEAD_TEACHER"));

router.post('/register', StudentController.register);
router.post('/link-learner', requireRole("ADMIN", "HEAD_TEACHER"), StudentController.linkLearner);
router.get('/', StudentController.list);
router.get('/:id/details', StudentController.getDetails);
router.post('/:id/parents', requireRole("ADMIN", "HEAD_TEACHER"), StudentController.linkParent);
router.delete('/:id/parents/:parentId', requireRole("ADMIN", "HEAD_TEACHER"), StudentController.unlinkParent);
router.post('/:id/promote', StudentController.promote);
router.post('/:id/transfer', StudentController.transfer);
router.patch('/:id/archive', StudentController.archive);
router.delete('/:id', requireRole("ADMIN", "SUPER_ADMIN"), StudentController.delete);
router.put('/:id', StudentController.update);

export default router;
