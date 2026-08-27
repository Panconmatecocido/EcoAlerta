import { Router } from 'express';
import { getReports, createReport } from '../controllers/report.controller';

const router = Router();

router.get('/', getReports);
router.post('/', createReport);

export default router;