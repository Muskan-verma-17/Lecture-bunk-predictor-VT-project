import Attendance from '../models/Attendance.js';

const calculateClassesNeeded = (record, attendancePercentage) => {
  if (attendancePercentage >= record.requiredPercentage) {
    return 0;
  }

  const numerator = (record.requiredPercentage * record.totalClasses) - (100 * record.attendedClasses);
  const denominator = 100 - record.requiredPercentage;
  return Math.max(0, Math.ceil(numerator / denominator));
};

const calculateSubject = (record) => {
  const attendancePercentage = record.totalClasses ? Math.round((record.attendedClasses / record.totalClasses) * 100) : 0;
  const afterBunkPercentage = Math.round((record.attendedClasses / (record.totalClasses + 1)) * 100);
  const afterAttendPercentage = Math.round(((record.attendedClasses + 1) / (record.totalClasses + 1)) * 100);
  const canBunk = afterBunkPercentage >= record.requiredPercentage;
  const classesNeeded = calculateClassesNeeded(record, attendancePercentage);

  return {
    id: record._id,
    subjectName: record.subjectName,
    totalClasses: record.totalClasses,
    attendedClasses: record.attendedClasses,
    missedClasses: Math.max(0, record.totalClasses - record.attendedClasses),
    requiredPercentage: record.requiredPercentage,
    upcomingLecture: record.upcomingLecture,
    attendancePercentage,
    afterBunkPercentage,
    afterAttendPercentage,
    canBunk,
    classesNeeded,
    status: attendancePercentage < record.requiredPercentage ? 'Low Attendance' : canBunk ? 'Safe to Bunk' : 'Attend Next Class',
    updatedAt: record.updatedAt
  };
};

const buildSummary = (subjects) => {
  const totalClasses = subjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
  const attendedClasses = subjects.reduce((sum, subject) => sum + subject.attendedClasses, 0);
  const missedClasses = Math.max(0, totalClasses - attendedClasses);
  const overallAttendance = totalClasses ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  return {
    totalClasses,
    attendedClasses,
    missedClasses,
    overallAttendance,
    lowSubjects: subjects.filter((subject) => subject.attendancePercentage < subject.requiredPercentage).length,
    safeSubjects: subjects.filter((subject) => subject.canBunk).length
  };
};

const buildReports = (subjects) => {
  const sortedSubjects = [...subjects].sort((first, second) => first.attendancePercentage - second.attendancePercentage);

  return {
    daily: subjects.filter((subject) => subject.upcomingLecture.toLowerCase().includes('today')),
    weekly: sortedSubjects,
    monthly: subjects,
    subjectWise: subjects.map((subject) => ({
      subjectName: subject.subjectName,
      attendedClasses: subject.attendedClasses,
      missedClasses: subject.missedClasses,
      attendancePercentage: subject.attendancePercentage
    }))
  };
};

const buildNotifications = (subjects) => {
  return subjects
    .filter((subject) => subject.attendancePercentage < subject.requiredPercentage || !subject.canBunk)
    .map((subject) => ({
      subjectName: subject.subjectName,
      type: subject.attendancePercentage < subject.requiredPercentage ? 'danger' : 'warning',
      message: subject.attendancePercentage < subject.requiredPercentage
        ? `${subject.subjectName} is below ${subject.requiredPercentage}%. Attend ${subject.classesNeeded} more class(es).`
        : `${subject.subjectName}: attend the next lecture before bunking.`
    }));
};

export const getAttendanceDashboard = async (request, response, next) => {
  try {
    const records = await Attendance.find({ user: request.user._id }).sort({ updatedAt: -1 });
    const subjects = records.map(calculateSubject);

    response.json({
      profile: {
        id: request.user._id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        minimumRequired: 75,
        course: 'Student'
      },
      summary: buildSummary(subjects),
      subjects,
      reports: buildReports(subjects),
      notifications: buildNotifications(subjects)
    });
  } catch (error) {
    next(error);
  }
};

export const createAttendanceRecord = async (request, response, next) => {
  try {
    const { subjectName, attendedClasses, totalClasses, requiredPercentage, upcomingLecture } = request.body;

    if (!subjectName || totalClasses === undefined || attendedClasses === undefined) {
      return response.status(400).json({ message: 'Subject name, total classes, and attended classes are required' });
    }

    if (Number(attendedClasses) > Number(totalClasses)) {
      return response.status(400).json({ message: 'Attended classes cannot exceed total classes' });
    }

    const record = await Attendance.create({
      user: request.user._id,
      subjectName,
      totalClasses: Number(totalClasses),
      attendedClasses: Number(attendedClasses),
      requiredPercentage: Number(requiredPercentage || 75),
      upcomingLecture: upcomingLecture || 'Today'
    });

    response.status(201).json(calculateSubject(record));
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'This subject already exists for your account' });
    }
    next(error);
  }
};

export const updateAttendanceRecord = async (request, response, next) => {
  try {
    const updates = { ...request.body };

    if (updates.totalClasses !== undefined) {
      updates.totalClasses = Number(updates.totalClasses);
    }

    if (updates.attendedClasses !== undefined) {
      updates.attendedClasses = Number(updates.attendedClasses);
    }

    if (updates.requiredPercentage !== undefined) {
      updates.requiredPercentage = Number(updates.requiredPercentage);
    }

    if (updates.attendedClasses > updates.totalClasses) {
      return response.status(400).json({ message: 'Attended classes cannot exceed total classes' });
    }

    const record = await Attendance.findOneAndUpdate(
      { _id: request.params.id, user: request.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!record) {
      return response.status(404).json({ message: 'Attendance record not found' });
    }

    response.json(calculateSubject(record));
  } catch (error) {
    next(error);
  }
};

export const deleteAttendanceRecord = async (request, response, next) => {
  try {
    const record = await Attendance.findOneAndDelete({ _id: request.params.id, user: request.user._id });

    if (!record) {
      return response.status(404).json({ message: 'Attendance record not found' });
    }

    response.json({ message: 'Attendance record deleted' });
  } catch (error) {
    next(error);
  }
};

