# Lecture Bunk Predictor MERN

A complete MERN Stack College college project that helps students monitor real-time subject-wise attendance from MongoDB and predict whether they can safely skip a lecture while maintaining the minimum required attendance percentage, usually 75%.

## Problem Statement

Many students do not know whether skipping a lecture will reduce their attendance below the minimum required percentage. Manual attendance calculation is time-consuming and often inaccurate.

## Proposed Solution

Lecture Bunk Predictor uses secure JWT authentication and user-owned MongoDB records to track subject-wise attendance, calculate overall attendance automatically, and predict whether a student can bunk the next lecture safely. No static attendance data is used in the running application.

## Objectives

1. Track subject-wise attendance.
2. Calculate overall attendance automatically.
3. Predict whether a student can bunk a lecture.
4. Help students maintain the minimum attendance requirement.
5. Display attendance reports with charts and statistics.

## Main Features

### User Authentication

- Registration is restricted to @ssipmt.com email addresses.
- Student accounts require Roll No during registration.

- Student registration
- Student login
- Secure JWT authentication
- Password encryption with bcrypt

### Student Dashboard

- Student profile
- Overall attendance percentage
- Subject-wise attendance
- Today's lecture schedule
- Attendance summary

### Attendance Management

Students can enter:

- Subject name
- Total classes conducted
- Classes attended
- Required attendance percentage
- Upcoming lecture time

### Reports & Analytics

- Daily report
- Weekly report
- Monthly report
- Subject-wise report

### Charts & Graphs

- Pie chart
- Bar chart
- Line chart
- Attendance trend graph

### Notifications

- Attendance below 75%
- Low attendance warning
- Reminder to attend upcoming lectures

## Real-Time Data Flow

- Students register or login to receive a JWT token.
- Protected attendance APIs read and write MongoDB records for the logged-in student only.
- The dashboard, reports, charts, schedule, and notifications are generated from live database records.
- Students can mark a lecture as attended or bunked, and the prediction updates after the API refreshes.

## Project Structure

- `client/` - React + Vite frontend
- `server/` - Express + MongoDB backend
- `*.html` and legacy CSS files - original static pages kept for reference

## Setup

```bash
npm run install:all
```

Create or update `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lecture-bunk-predictor
JWT_SECRET=replace-with-a-long-secret
CLIENT_URL=http://localhost:5173
TEACHER_INVITE_CODE=choose-a-private-teacher-code
```

## Run Locally

Start the API:

```bash
npm run server
```

Start the React app in another terminal:

```bash
npm run client
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```



## Teacher Invite Code

Teacher accounts require TEACHER_INVITE_CODE during registration. Keep this value private and do not commit your real local .env file.


