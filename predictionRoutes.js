import { Router } from 'express';
import { createLecture, getPredictions } from '../controllers/predictionController.js';

const router = Router();

router.get('/', getPredictions);
router.post('/', createLecture);

export default router;
