import { Router } from 'express';
import { createAttendanceRecord, deleteAttendanceRecord, getAttendanceDashboard, updateAttendanceRecord } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/dashboard', getAttendanceDashboard);
router.post('/', createAttendanceRecord);
router.put('/:id', updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);

export default router;
