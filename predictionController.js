import Lecture from '../models/Lecture.js';
import Vote from '../models/Vote.js';

const demoLectures = [
  {
    id: 'demo-dbms',
    subject: 'DBMS',
    teacher: 'Prof. Rao',
    room: 'C-204',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bunkChance: 80,
    detail: 'Chance that fewer than 10 students will show up'
  },
  {
    id: 'demo-os',
    subject: 'Operating Systems',
    teacher: 'Dr. Sharma',
    room: 'Lab-2',
    startsAt: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
    bunkChance: 46,
    detail: 'Balanced turnout expected'
  },
  {
    id: 'demo-math',
    subject: 'Discrete Mathematics',
    teacher: 'Prof. Iyer',
    room: 'A-105',
    startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    bunkChance: 31,
    detail: 'Attendance likely stays strong'
  }
];

const calculateBunkChance = (lecture, attendVotes, bunkVotes) => {
  const totalVotes = attendVotes + bunkVotes;
  const crowdSignal = totalVotes ? (bunkVotes / totalVotes) * 100 : 50;
  const historySignal = 100 - lecture.historicalAttendanceRate;
  const moodSignal = lecture.moodIndex;

  return Math.round(crowdSignal * 0.5 + historySignal * 0.35 + moodSignal * 0.15);
};

export const getPredictions = async (request, response, next) => {
  try {
    const lectures = await Lecture.find().sort({ startsAt: 1 }).limit(8);

    if (!lectures.length) {
      return response.json(demoLectures);
    }

    const predictions = await Promise.all(
      lectures.map(async (lecture) => {
        const [attendVotes, bunkVotes] = await Promise.all([
          Vote.countDocuments({ lecture: lecture._id, choice: 'attend' }),
          Vote.countDocuments({ lecture: lecture._id, choice: 'bunk' })
        ]);

        return {
          id: lecture._id,
          subject: lecture.subject,
          teacher: lecture.teacher,
          room: lecture.room,
          startsAt: lecture.startsAt,
          bunkChance: calculateBunkChance(lecture, attendVotes, bunkVotes),
          detail: `${attendVotes + bunkVotes} anonymous votes counted`
        };
      })
    );

    response.json(predictions);
  } catch (error) {
    next(error);
  }
};

export const createLecture = async (request, response, next) => {
  try {
    const lecture = await Lecture.create(request.body);
    response.status(201).json(lecture);
  } catch (error) {
    next(error);
  }
};
