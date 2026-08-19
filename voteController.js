import Vote from '../models/Vote.js';

export const submitVote = async (request, response, next) => {
  try {
    const { lectureId, choice, anonymousKey } = request.body;

    if (!lectureId || !choice || !anonymousKey) {
      return response.status(400).json({ message: 'lectureId, choice, and anonymousKey are required' });
    }

    const vote = await Vote.findOneAndUpdate(
      { lecture: lectureId, anonymousKey },
      { choice },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    response.status(201).json({ message: 'Vote saved', vote });
  } catch (error) {
    next(error);
  }
};
