const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Use a temporary data file for tests to avoid touching the real courses.json
const TEST_DATA = path.join(__dirname, 'test-courses.json');
process.env.CODECRAFTHUB_DATA_FILE = TEST_DATA;

const app = require('../app');

beforeEach(() => {
  if (fs.existsSync(TEST_DATA)) {
    fs.unlinkSync(TEST_DATA);
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA)) {
    fs.unlinkSync(TEST_DATA);
  }
});

describe('CodeCraftHub API - integration tests', () => {
  test('GET / returns welcome message and endpoints', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('endpoints');
  });

  test('Creating a course with missing fields returns 400', async () => {
    await request(app)
      .post('/api/courses')
      .send({ name: 'Only name' })
      .expect(400);
  });

  test('Create, read, update, delete course lifecycle', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/courses')
      .send({
        name: 'Node.js Basics',
        description: 'Learn Node',
        target_date: '2026-10-01',
        status: 'Not Started',
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    const id = createRes.body.course.id;
    expect(id).toBeGreaterThan(0);

    // Get all
    const allRes = await request(app).get('/api/courses').expect(200);
    expect(allRes.body.count).toBe(1);

    // Get by id
    const getRes = await request(app).get(`/api/courses/${id}`).expect(200);
    expect(getRes.body.course.id).toBe(id);

    // Update
    const updateRes = await request(app)
      .put(`/api/courses/${id}`)
      .send({ status: 'Completed' })
      .expect(200);
    expect(updateRes.body.course.status).toBe('Completed');

    // Delete
    const delRes = await request(app).delete(`/api/courses/${id}`).expect(200);
    expect(delRes.body.course.id).toBe(id);

    // Confirm deleted
    const afterRes = await request(app).get('/api/courses').expect(200);
    expect(afterRes.body.count).toBe(0);
  });

  test('Invalid ID formats and not-found return proper errors', async () => {
    await request(app).get('/api/courses/abc').expect(400);
    await request(app).get('/api/courses/999').expect(404);
  });

  test('Invalid JSON in request body returns 400', async () => {
    await request(app)
      .post('/api/courses')
      .set('Content-Type', 'application/json')
      .send('{"bad":}')
      .expect(400);
  });
});
