import { Router } from 'express';
import { allowRoles, protect } from '../middleware/authMiddleware.js';
import { createTeacherLecture, getStudentTodayLectures, getTeacherLectureAnalysis, getTeacherLectures, markLectureAttendance } from '../controllers/lectureController.js';

const router = Router();

router.use(protect);
router.get('/student/today', allowRoles('student'), getStudentTodayLectures);
router.post('/:id/mark', allowRoles('student'), markLectureAttendance);
router.get('/teacher', allowRoles('teacher'), getTeacherLectures);
router.post('/teacher', allowRoles('teacher'), createTeacherLecture);
router.get('/teacher/:id/analysis', allowRoles('teacher'), getTeacherLectureAnalysis);

export default router;
