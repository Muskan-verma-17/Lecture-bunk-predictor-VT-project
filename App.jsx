import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, BellRing, BookOpenCheck, CalendarDays, CheckCircle2, GraduationCap, LockKeyhole, PieChart, Plus, ShieldCheck, UserRound, UsersRound, XCircle } from 'lucide-react';
import { createTeacherLecture, fetchCurrentUser, fetchStudentTodayLectures, fetchTeacherLectureAnalysis, fetchTeacherLectures, loginUser, markLectureAttendance, registerUser } from './api.js';

function App() {
  const [route, setRoute] = useState(localStorage.getItem('authToken') ? 'panel' : 'login');
  const [currentUser, setCurrentUser] = useState(null);
  const [studentLectures, setStudentLectures] = useState([]);
  const [teacherLectures, setTeacherLectures] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  const isTeacher = currentUser?.role === 'teacher';

  const loadPanel = async (user = currentUser) => {
    if (!localStorage.getItem('authToken') || !user) return;

    try {
      setLoading(true);
      if (user.role === 'teacher') {
        const data = await fetchTeacherLectures();
        setTeacherLectures(data.lectures);
      } else {
        const data = await fetchStudentTodayLectures();
        setStudentLectures(data.lectures);
      }
      setMessage('Dashboard synced successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    if (!localStorage.getItem('authToken')) return;

    try {
      const data = await fetchCurrentUser();
      setCurrentUser(data.user);
      await loadPanel(data.user);
    } catch {
      handleLogout();
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const handleAuthSuccess = async (result) => {
    localStorage.setItem('authToken', result.token);
    setCurrentUser(result.user);
    setRoute('panel');
    setMessage(`Welcome, ${result.user.firstName}.`);
    await loadPanel(result.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setStudentLectures([]);
    setTeacherLectures([]);
    setSelectedAnalysis(null);
    setRoute('login');
    setMessage('Logged out successfully.');
  };

  const handleCreateLecture = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await createTeacherLecture({
        subjectName: payload.subjectName,
        lectureDate: payload.lectureDate,
        startTime: payload.startTime,
        room: payload.room,
        minimumRequired: Number(payload.minimumRequired || 75)
      });
      event.currentTarget.reset();
      await loadPanel(currentUser);
      setMessage('Lecture session created successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleMarkLecture = async (lectureId, status) => {
    try {
      await markLectureAttendance(lectureId, status);
      await loadPanel(currentUser);
      setMessage(`Your response has been marked as ${status}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleViewAnalysis = async (lectureId) => {
    try {
      const data = await fetchTeacherLectureAnalysis(lectureId);
      setSelectedAnalysis(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="app-shell">
      <Navbar route={route} setRoute={setRoute} isAuthenticated={isAuthenticated} user={currentUser} />
      {!isAuthenticated && route !== 'about' && <AuthCard mode={route === 'register' ? 'register' : 'login'} onAuthSuccess={handleAuthSuccess} setRoute={setRoute} />}
      {route === 'panel' && isAuthenticated && !isTeacher && <StudentPanel user={currentUser} lectures={studentLectures} onMark={handleMarkLecture} message={message} loading={loading} />}
      {route === 'panel' && isAuthenticated && isTeacher && <TeacherPanel user={currentUser} lectures={teacherLectures} analysis={selectedAnalysis} onCreate={handleCreateLecture} onViewAnalysis={handleViewAnalysis} message={message} loading={loading} />}
      {route === 'profile' && isAuthenticated && <ProfilePage user={currentUser} studentLectures={studentLectures} teacherLectures={teacherLectures} onLogout={handleLogout} />}
      {route === 'about' && <About />}
      <footer className="footer">© 2026 Lecture Bunk Predictor. Secure attendance analytics for modern campuses.</footer>
    </div>
  );
}

function Navbar({ route, setRoute, isAuthenticated, user }) {
  const navItems = isAuthenticated
    ? [['panel', user?.role === 'teacher' ? 'Teacher Panel' : 'Student Panel'], ['about', 'About']]
    : [['about', 'About'], ['login', 'Login']];
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U';

  return (
    <header className="navbar pro-navbar">
      <button className="brand" onClick={() => setRoute(isAuthenticated ? 'panel' : 'about')}>
        <GraduationCap size={28} />
        <span>Lecture Bunk Predictor</span>
      </button>
      <nav>
        {navItems.map(([key, label]) => <button key={key} className={route === key ? 'active' : ''} onClick={() => setRoute(key)}>{label}</button>)}
        {isAuthenticated ? (
          <button className="profile-chip" onClick={() => setRoute('profile')} aria-label="Open profile">
            <UserRound size={18} />
            <span>{initials}</span>
          </button>
        ) : (
          <button className="nav-cta" onClick={() => setRoute('register')}>Create Account</button>
        )}
      </nav>
    </header>
  );
}

function StudentPanel({ user, lectures, onMark, message, loading }) {
  const summary = useMemo(() => {
    const attendCount = lectures.filter((lecture) => lecture.myStatus === 'attend').length;
    const bunkCount = lectures.filter((lecture) => lecture.myStatus === 'bunk').length;
    return { attendCount, bunkCount, pendingCount: lectures.length - attendCount - bunkCount };
  }, [lectures]);

  return (
    <main>
      <section className="hero dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow"><ShieldCheck size={16} /> Student Workspace</span>
          <h1>Submit lecture attendance with confidence.</h1>
          <p>Review today’s scheduled classes, mark your response, and keep every attendance decision synced securely with the campus database.</p>
          <ProfileBadge user={user} />
        </div>
        <aside className="prediction-card pro-summary-card">
          <span className="card-label">Today’s Response Summary</span>
          <h2>{lectures.length} Scheduled Lectures</h2>
          <div className="bunk-meter">{summary.attendCount}</div>
          <p className="prediction-detail">Marked as attended. Pending: {summary.pendingCount}, Bunk: {summary.bunkCount}</p>
        </aside>
      </section>
      <section className="section stats-grid">
        <StatCard icon={<CalendarDays />} label="Scheduled" value={lectures.length} />
        <StatCard icon={<CheckCircle2 />} label="Attended" value={summary.attendCount} />
        <StatCard icon={<XCircle />} label="Bunk Marked" value={summary.bunkCount} tone="warning" />
        <StatCard icon={<BellRing />} label="Pending" value={summary.pendingCount} />
      </section>
      <section className="section">
        <article className="panel-card wide-card">
          <div className="section-heading compact"><span className="eyebrow">Lecture Attendance</span><h2>Today’s Lecture Sessions</h2></div>
          {loading ? <EmptyState text="Loading lecture sessions..." /> : !lectures.length ? <EmptyState text="No lecture sessions are available for today." /> : (
            <div className="lecture-grid">
              {lectures.map((lecture) => <StudentLectureCard key={lecture.id} lecture={lecture} onMark={onMark} />)}
            </div>
          )}
          {message && <p className="helper-text">{message}</p>}
        </article>
      </section>
    </main>
  );
}

function StudentLectureCard({ lecture, onMark }) {
  const teacherName = lecture.teacher ? `${lecture.teacher.firstName} ${lecture.teacher.lastName}` : 'Faculty';

  return (
    <article className="lecture-card pro-lecture-card">
      <div><span className="eyebrow">{lecture.startTime} - {lecture.room}</span><h3>{lecture.subjectName}</h3><p>Faculty: {teacherName}</p></div>
      <div className={lecture.myStatus ? `result-pill ${lecture.myStatus === 'attend' ? 'safe' : 'danger'}` : 'result-pill'}>{lecture.myStatus || 'Not marked'}</div>
      <div className="row-actions">
        <button type="button" onClick={() => onMark(lecture.id, 'attend')}><CheckCircle2 size={15} /> Attend</button>
        <button type="button" onClick={() => onMark(lecture.id, 'bunk')}><XCircle size={15} /> Bunk</button>
      </div>
    </article>
  );
}

function TeacherPanel({ user, lectures, analysis, onCreate, onViewAnalysis, message, loading }) {
  const todayLectures = lectures.filter((lecture) => new Date(lecture.lectureDate).toDateString() === new Date().toDateString());

  return (
    <main>
      <section className="hero dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow"><UsersRound size={16} /> Faculty Workspace</span>
          <h1>Track lecture engagement in real time.</h1>
          <p>Create lecture sessions, monitor student responses, and use live attendance analytics to identify engagement risks before class begins.</p>
          <ProfileBadge user={user} />
        </div>
        <aside className="prediction-card pro-summary-card"><span className="card-label">Lecture Overview</span><h2>{todayLectures.length} Today</h2><div className="bunk-meter">{lectures.length}</div><p className="prediction-detail">Total sessions created in your workspace.</p></aside>
      </section>
      <section className="section split-section">
        <CreateLectureForm onCreate={onCreate} message={message} />
        <TeacherAnalysisCard analysis={analysis} />
      </section>
      <section className="section">
        <article className="panel-card wide-card">
          <div className="section-heading compact"><span className="eyebrow">Lecture Analytics</span><h2>Managed Lecture Sessions</h2></div>
          {loading ? <EmptyState text="Loading lecture analytics..." /> : !lectures.length ? <EmptyState text="Create a lecture session to begin collecting responses." /> : <TeacherLectureTable lectures={lectures} onViewAnalysis={onViewAnalysis} />}
        </article>
      </section>
    </main>
  );
}

function CreateLectureForm({ onCreate, message }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <article className="panel-card">
      <div className="section-heading compact"><span className="eyebrow"><Plus size={15} /> New Session</span><h2>Create Lecture</h2></div>
      <form className="attendance-form" onSubmit={onCreate}>
        <label>Subject Name<input name="subjectName" placeholder="Database Management Systems" required /></label>
        <label>Lecture Date<input name="lectureDate" type="date" defaultValue={today} required /></label>
        <label>Start Time<input name="startTime" type="time" required /></label>
        <label>Room / Lab<input name="room" placeholder="Block C - Room 204" required /></label>
        <label>Minimum Attendance %<input name="minimumRequired" type="number" min="1" max="100" defaultValue="75" /></label>
        <button className="primary-button" type="submit">Create Session</button>
      </form>
      {message && <p className="helper-text">{message}</p>}
    </article>
  );
}

function TeacherLectureTable({ lectures, onViewAnalysis }) {
  return (
    <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Room</th><th>Attend</th><th>Bunk</th><th>Prediction</th><th>Action</th></tr></thead><tbody>
      {lectures.map((lecture) => <tr key={lecture.id}><td>{lecture.subjectName}</td><td>{new Date(lecture.lectureDate).toLocaleDateString()}</td><td>{lecture.startTime}</td><td>{lecture.room}</td><td>{lecture.attendCount}</td><td>{lecture.bunkCount}</td><td><span className={lecture.attendancePercentage >= lecture.minimumRequired ? 'status safe' : 'status danger'}>{lecture.prediction}</span></td><td><button className="small-button" type="button" onClick={() => onViewAnalysis(lecture.id)}>View Analysis</button></td></tr>)}
    </tbody></table></div>
  );
}

function TeacherAnalysisCard({ analysis }) {
  if (!analysis) {
    return <article className="panel-card"><div className="section-heading compact"><span className="eyebrow"><BarChart3 size={15} /> Attendance Insight</span><h2>Select a Session</h2></div><EmptyState text="Choose View Analysis from any lecture session." /></article>;
  }

  return (
    <article className="panel-card">
      <div className="section-heading compact"><span className="eyebrow"><BarChart3 size={15} /> Attendance Insight</span><h2>{analysis.lecture.subjectName}</h2></div>
      <div className="analysis-grid"><StatCard icon={<CheckCircle2 />} label="Attend" value={analysis.lecture.attendCount} /><StatCard icon={<XCircle />} label="Bunk" value={analysis.lecture.bunkCount} tone="warning" /></div>
      <div className="pie" style={{ '--value': `${analysis.lecture.attendancePercentage}%` }}><strong>{analysis.lecture.attendancePercentage}%</strong></div>
      <p className="prediction-detail">{analysis.lecture.recommendation}</p>
      <div className="notification-list">{analysis.students.length ? analysis.students.map((student) => <div className={`notification ${student.status === 'attend' ? 'safe' : 'warning'}`} key={student.id}><UserRound size={16} /><span>{student.name} marked {student.status}</span></div>) : <p className="helper-text">No student responses have been submitted yet.</p>}</div>
    </article>
  );
}

function ProfilePage({ user, studentLectures, teacherLectures, onLogout }) {
  const total = user?.role === 'teacher' ? teacherLectures.length : studentLectures.length;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U';

  return (
    <main className="profile-page">
      <section className="profile-card-pro">
        <div className="profile-cover" />
        <div className="profile-avatar">{initials}</div>
        <span className="eyebrow"><UserRound size={16} /> Account Profile</span>
        <h1>{user?.firstName} {user?.lastName}</h1>
        <p>{user?.role === 'teacher' ? 'Faculty Access' : 'Student Access'} - {user?.department}</p>
        <div className="profile-meta-grid">
          <ProfileMeta label="Email Address" value={user?.email || '-'} />
          <ProfileMeta label="Account Role" value={user?.role || '-'} />
          {user?.role === 'student' && <ProfileMeta label="Roll No" value={user?.rollNo || '-'} />}
          <ProfileMeta label={user?.role === 'teacher' ? 'Created Sessions' : 'Today Sessions'} value={total} />
          <ProfileMeta label="Department" value={user?.department || '-'} />
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>Logout</button>
      </section>
    </main>
  );
}

function ProfileMeta({ label, value }) {
  return <div className="profile-meta"><span>{label}</span><strong>{value}</strong></div>;
}

function AuthCard({ mode, onAuthSuccess, setRoute }) {
  const isRegister = mode === 'register';
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = isRegister ? await registerUser(payload) : await loginUser(payload);
      await onAuthSuccess(result);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="auth-page"><form className="auth-card pro-auth-card" onSubmit={handleSubmit}><span className="eyebrow">{isRegister ? 'Create Workspace' : 'Secure Access'}</span><h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>{isRegister && <><div className="form-row"><label>First Name<input name="firstName" required /></label><label>Last Name<input name="lastName" required /></label></div><label>Role<select name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="student">Student</option><option value="teacher">Teacher</option></select></label>{role === 'student' && <label>Roll No<input name="rollNo" placeholder="Enter Roll No" required /></label>}{role === 'teacher' && <label>Teacher Invite Code<input name="teacherInviteCode" type="password" placeholder="Required for teacher accounts" required /></label>}<label>Department<input name="department" placeholder="Computer Science" /></label></>}<label>Email<input name="email" type="email" placeholder="name@ssipmt.com" pattern=".+@ssipmt[.]com" title="Only @ssipmt.com email addresses are allowed" required /></label><label>Password<input name="password" type="password" minLength={8} required /></label><button className="primary-button" type="submit">{isRegister ? 'Create Account' : 'Sign In'}</button>{message && <p className="helper-text">{message}</p>}<button className="link-button" type="button" onClick={() => setRoute(isRegister ? 'login' : 'register')}>{isRegister ? 'Already have an account? Sign in' : 'New here? Create account'}</button></form></main>
  );
}

function About() {
  return <main><section className="page-hero"><span className="eyebrow">Professional Attendance System</span><h1>A role-based attendance intelligence platform.</h1><p>Students submit lecture responses, while faculty manage sessions and analyze live attendance trends through a secure MERN workflow.</p></section><section className="section feature-grid"><Feature icon={<LockKeyhole />} title="Role-Based Access" text="JWT authentication separates student and faculty workspaces with protected backend routes." /><Feature icon={<BookOpenCheck />} title="Student Attendance" text="Students can submit or update their response for each lecture scheduled today." /><Feature icon={<BarChart3 />} title="Faculty Analytics" text="Faculty can review response counts, attendance percentage, prediction status, and individual submissions." /></section></main>;
}

function ProfileBadge({ user }) {
  return <div className="profile-card"><UserRound /><div><strong>{user?.firstName} {user?.lastName}</strong><span>{user?.role === 'student' ? `Roll No: ${user?.rollNo || '-'}` : user?.role} - {user?.department}</span></div></div>;
}

function StatCard({ icon, label, value, tone = 'normal' }) {
  return <article className={`stat-card ${tone}`}><div className="feature-icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function Feature({ icon, title, text }) {
  return <article className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>;
}

export default App;


