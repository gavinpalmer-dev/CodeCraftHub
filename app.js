/**
 * CodeCraftHub - Personalized Learning Platform REST API
 *
 * This beginner-friendly Express API lets developers track courses they want
 * to learn. Course data is stored in a local JSON file instead of a database.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Store course data in courses.json in the same folder as app.js
// Allow overriding the data file via env for tests: CODECRAFTHUB_DATA_FILE
const DATA_FILE = process.env.CODECRAFTHUB_DATA_FILE || path.join(__dirname, "courses.json");

// Valid course statuses allowed by the API
const VALID_STATUSES = ["Not Started", "In Progress", "Completed"];

// Middleware: allows Express to read JSON data from request bodies
app.use(express.json());

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create courses.json automatically if it does not already exist.
 * The file starts as an empty JSON array: []
 */
function ensureDataFileExists() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

/**
 * Read all courses from courses.json.
 * Throws an error if the file cannot be read or contains invalid JSON.
 */
function readCourses() {
  ensureDataFileExists();

  try {
    const fileData = fs.readFileSync(DATA_FILE, "utf8");

    // If the file is empty for any reason, treat it as an empty course list.
    if (!fileData.trim()) {
      return [];
    }

    return JSON.parse(fileData);
  } catch (error) {
    throw new Error(`File read error: ${error.message}`);
  }
}

/**
 * Save the full courses array back into courses.json.
 * Throws an error if the file cannot be written.
 */
function writeCourses(courses) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), "utf8");
  } catch (error) {
    throw new Error(`File write error: ${error.message}`);
  }
}

/**
 * Generate the next course ID.
 * IDs start at 1 and increase based on the highest existing ID.
 */
function getNextId(courses) {
  if (courses.length === 0) {
    return 1;
  }

  const highestId = Math.max(...courses.map((course) => course.id));
  return highestId + 1;
}

/**
 * Check if a date is in YYYY-MM-DD format.
 * This keeps validation beginner-friendly and simple.
 */
function isValidDateFormat(dateValue) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
}

/**
 * Validate required course fields and allowed values.
 * Used when creating a course.
 */
function validateNewCourse(courseData) {
  const requiredFields = ["name", "description", "target_date", "status"];

  for (const field of requiredFields) {
    if (!courseData[field] || String(courseData[field]).trim() === "") {
      return `${field} is required`;
    }
  }

  if (!isValidDateFormat(courseData.target_date)) {
    return "target_date must use the format YYYY-MM-DD";
  }

  if (!VALID_STATUSES.includes(courseData.status)) {
    return `status must be one of: ${VALID_STATUSES.join(", ")}`;
  }

  return null;
}

/**
 * Validate fields provided during an update.
 * Unlike create, PUT only validates fields that are included in the request.
 */
function validateCourseUpdate(courseData) {
  if ("name" in courseData && String(courseData.name).trim() === "") {
    return "name cannot be empty";
  }

  if ("description" in courseData && String(courseData.description).trim() === "") {
    return "description cannot be empty";
  }

  if ("target_date" in courseData && !isValidDateFormat(courseData.target_date)) {
    return "target_date must use the format YYYY-MM-DD";
  }

  if ("status" in courseData && !VALID_STATUSES.includes(courseData.status)) {
    return `status must be one of: ${VALID_STATUSES.join(", ")}`;
  }

  return null;
}

/**
 * Convert the route ID parameter into a number.
 */
function parseCourseId(idParameter) {
  const courseId = Number(idParameter);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return null;
  }

  return courseId;
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Home route: serve the frontend page.
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * POST /api/courses
 * Add a new course.
 */
app.post("/api/courses", (req, res) => {
  try {
    const validationError = validateNewCourse(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const courses = readCourses();

    const newCourse = {
      id: getNextId(courses),
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: new Date().toISOString(),
    };

    courses.push(newCourse);
    writeCourses(courses);

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/courses
 * Get all courses.
 */
app.get("/api/courses", (req, res) => {
  try {
    const courses = readCourses();

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/courses/:id
 * Get one specific course by ID.
 */
app.get("/api/courses/:id", (req, res) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID must be a positive whole number",
      });
    }

    const courses = readCourses();
    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: `Course with ID ${courseId} was not found`,
      });
    }

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/courses/:id
 * Update an existing course.
 */
app.put("/api/courses/:id", (req, res) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID must be a positive whole number",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one course field must be provided for update",
      });
    }

    const validationError = validateCourseUpdate(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const courses = readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Course with ID ${courseId} was not found`,
      });
    }

    // Keep id and created_at unchanged, but update the editable fields provided.
    const updatedCourse = {
      ...courses[courseIndex],
      ...(req.body.name !== undefined && { name: req.body.name.trim() }),
      ...(req.body.description !== undefined && {
        description: req.body.description.trim(),
      }),
      ...(req.body.target_date !== undefined && {
        target_date: req.body.target_date,
      }),
      ...(req.body.status !== undefined && { status: req.body.status }),
    };

    courses[courseIndex] = updatedCourse;
    writeCourses(courses);

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/courses/:id
 * Delete a course by ID.
 */
app.delete("/api/courses/:id", (req, res) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID must be a positive whole number",
      });
    }

    const courses = readCourses();
    const courseIndex = courses.findIndex((item) => item.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Course with ID ${courseId} was not found`,
      });
    }

    const deletedCourse = courses.splice(courseIndex, 1)[0];
    writeCourses(courses);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      course: deletedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// GENERAL ERROR HANDLERS
// ============================================================================

/**
 * Handle invalid JSON sent in the request body.
 */
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
  }

  return next(error);
});

// If the file is executed directly, start the server. When required (by tests),
// the `app` object is exported so tests can run requests without binding a port.
if (require.main === module) {
  ensureDataFileExists();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`CodeCraftHub API listening on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`Course data file: ${DATA_FILE}`);
  });
}

/**
 * Handle routes that do not exist.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

/**
 * Final fallback error handler.
 */
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

module.exports = app;
