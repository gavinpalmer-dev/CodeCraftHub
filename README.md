# CodeCraftHub

CodeCraftHub is a simple personalized learning platform where developers can track courses they want to learn.

## Beginner-Friendly Project Structure

```text
CodeCraftHub/
├── app.js          # Main Express server and REST API routes
├── courses.json    # JSON text file used to store course data
├── package.json    # Project metadata, dependencies, and npm scripts
└── README.md       # Setup instructions and endpoint examples
```

## REST API Endpoints

- `POST /api/courses` - Add a new course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get a specific course
- `PUT /api/courses/:id` - Update a course
- `DELETE /api/courses/:id` - Delete a course

## Course Fields

Each course has:

- `id` - Auto-generated number starting from 1
- `name` - Required course name
- `description` - Required course description
- `target_date` - Required date in `YYYY-MM-DD` format
- `status` - Required value: `Not Started`, `In Progress`, or `Completed`
- `created_at` - Auto-generated timestamp

## How Data Storage Works

This project does not use a database. Instead:

1. `app.js` checks whether `courses.json` exists.
2. If `courses.json` does not exist, the app creates it automatically with an empty array: `[]`.
3. GET routes read course data from the JSON file.
4. POST, PUT, and DELETE routes update the course list and write the updated data back to `courses.json`.

## How to Run

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The API will run on:

```text
http://localhost:5000
```

## Sample Requests

### Create a Course

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Node.js Basics",
    "description": "Learn the fundamentals of Node.js and server-side JavaScript.",
    "target_date": "2026-10-15",
    "status": "Not Started"
  }'
```

### Get All Courses

```bash
curl http://localhost:5000/api/courses
```

### Get One Course

```bash
curl http://localhost:5000/api/courses/1
```

### Update a Course

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Completed"
  }'
```

### Delete a Course

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```
```
