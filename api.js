const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('authToken');

const requestJson = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }

  return response.json();
};

export const fetchCurrentUser = () => requestJson('/auth/me');

export const registerUser = (payload) => requestJson('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const loginUser = (payload) => requestJson('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const fetchStudentTodayLectures = () => requestJson('/lectures/student/today');

export const markLectureAttendance = (id, status) => requestJson(`/lectures/${id}/mark`, {
  method: 'POST',
  body: JSON.stringify({ status })
});

export const fetchTeacherLectures = () => requestJson('/lectures/teacher');

export const createTeacherLecture = (payload) => requestJson('/lectures/teacher', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const fetchTeacherLectureAnalysis = (id) => requestJson(`/lectures/teacher/${id}/analysis`);
