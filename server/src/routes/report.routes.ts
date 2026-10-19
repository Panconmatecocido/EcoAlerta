import { Router } from 'express';
import { getReports, createReport, softDeleteReport } from '../controllers/report.controller';

const router = Router();

router.get('/', getReports);
router.post('/', createReport);
router.patch('/:id/soft-delete', softDeleteReport);

export default router;