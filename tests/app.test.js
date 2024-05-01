const request = require('supertest');
const app = require('..');

describe('GET Endpoints', () => {

    let server;

    beforeAll((done) => {
        server = app.listen(5000, done);  // Start the server at a test-specific port
    });

    afterAll((done) => {
        server.close(done);  // Make sure to close the server after tests
    });
    it('should get the main endpoint', async () => {
        const res = await request(app)
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toEqual({
            status: 200,
            message: "Ping"
        });
    });

    it('should get a random compliment', async () => {
        const res = await request(app)
            .get('/compliment')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toHaveProperty('status', 200);
        expect(res.body).toHaveProperty('message');
    });
});
