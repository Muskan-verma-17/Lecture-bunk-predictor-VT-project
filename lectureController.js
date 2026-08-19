import LectureSession from '../models/LectureSession.js';

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const getAnalysis = (lecture, studentId) => {
  const attendCount = lecture.marks.filter((mark) => mark.status === 'attend').length;
  const bunkCount = lecture.marks.filter((mark) => mark.status === 'bunk').length;
  const totalResponses = attendCount + bunkCount;
  const attendancePercentage = totalResponses ? Math.round((attendCount / totalResponses) * 100) : 0;
  const bunkPercentage = totalResponses ? Math.round((bunkCount / totalResponses) * 100) : 0;
  const studentMark = studentId ? lecture.marks.find((mark) => String(mark.student?._id || mark.student) === String(studentId)) : null;

  return {
    id: lecture._id,
    subjectName: lecture.subjectName,
    teacher: lecture.teacher,
    lectureDate: lecture.lectureDate,
    startTime: lecture.startTime,
    room: lecture.room,
    minimumRequired: lecture.minimumRequired,
    attendCount,
    bunkCount,
    totalResponses,
    attendancePercentage,
    bunkPercentage,
    prediction: attendancePercentage >= lecture.minimumRequired ? 'Healthy attendance expected' : 'Low attendance risk',
    recommendation: attendancePercentage >= lecture.minimumRequired ? 'Lecture can continue as planned' : 'Send reminder before lecture starts',
    myStatus: studentMark?.status || null
  };
};

export const getStudentTodayLectures = async (request, response, next) => {
  try {
    const lectures = await LectureSession.find({ lectureDate: { $gte: startOfDay(), $lt: endOfDay() } })
      .populate('teacher', 'firstName lastName email department')
      .sort({ startTime: 1 });

    response.json({ lectures: lectures.map((lecture) => getAnalysis(lecture, request.user._id)) });
  } catch (error) {
    next(error);
  }
};

export const markLectureAttendance = async (request, response, next) => {
  try {
    const { status } = request.body;

    if (!['attend', 'bunk'].includes(status)) {
      return response.status(400).json({ message: 'Status must be attend or bunk' });
    }

    const lecture = await LectureSession.findById(request.params.id);
    if (!lecture) {
      return response.status(404).json({ message: 'Lecture not found' });
    }

    const existingMark = lecture.marks.find((mark) => String(mark.student) === String(request.user._id));
    if (existingMark) {
      existingMark.status = status;
      existingMark.markedAt = new Date();
    } else {
      lecture.marks.push({ student: request.user._id, status });
    }

    await lecture.save();
    await lecture.populate('teacher', 'firstName lastName email department');
    response.json({ lecture: getAnalysis(lecture, request.user._id) });
  } catch (error) {
    next(error);
  }
};

export const createTeacherLecture = async (request, response, next) => {
  try {
    const { subjectName, lectureDate, startTime, room, minimumRequired } = request.body;

    if (!subjectName || !lectureDate || !startTime || !room) {
      return response.status(400).json({ message: 'Subject, date, time, and room are required' });
    }

    const lecture = await LectureSession.create({
      subjectName,
      lectureDate,
      startTime,
      room,
      minimumRequired: Number(minimumRequired || 75),
      teacher: request.user._id
    });

    response.status(201).json({ lecture: getAnalysis(lecture) });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'This lecture already exists for your schedule' });
    }
    next(error);
  }
};

export const getTeacherLectures = async (request, response, next) => {
  try {
    const lectures = await LectureSession.find({ teacher: request.user._id })
      .populate('marks.student', 'firstName lastName email department')
      .sort({ lectureDate: -1, startTime: 1 });

    response.json({ lectures: lectures.map((lecture) => getAnalysis(lecture)) });
  } catch (error) {
    next(error);
  }
};

export const getTeacherLectureAnalysis = async (request, response, next) => {
  try {
    const lecture = await LectureSession.findOne({ _id: request.params.id, teacher: request.user._id })
      .populate('marks.student', 'firstName lastName email department');

    if (!lecture) {
      return response.status(404).json({ message: 'Lecture not found' });
    }

    response.json({
      lecture: getAnalysis(lecture),
      students: lecture.marks.map((mark) => ({
        id: mark.student._id,
        name: `${mark.student.firstName} ${mark.student.lastName}`,
        email: mark.student.email,
        status: mark.status,
        markedAt: mark.markedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};
