const request = require("supertest");
const app = require("../app");

test("it can register new user", async () => {
    const response = await request(app).post("/register").send({
        firstname: "John",
        lastname: "Doe",
        email: "john@test.test",
        password: "secret",
    });
    expect(response.statusCode).toBe(200);
});

test("it can login user", async () => {
    const response = await request(app).post("/login").send({
        email: "john@test.test",
        password: "secret",
    });
    expect(response.statusCode).toBe(200);
});

test("an unauthenticated user can not logout", async () => {
    const response = await request(app).post("/logout");
    expect(response.statusCode).toBe(401);
});

test("it can return all depositions", async () => {
    const response = await request(app).get("/depositions");
    expect(response.statusCode).toBe(200);
    expect(response.body.result).toBe(true);
    console.log(response.body);
    response.body.depositions.map((deposition) => {
        expect(deposition).toHaveProperty("_id");
        expect(deposition).toHaveProperty("name");
        expect(deposition).toHaveProperty("description");
        expect(deposition).toHaveProperty("status");
        expect(deposition).toHaveProperty("type");
        expect(deposition).toHaveProperty("visualProofs");
        // expect(deposition).toHaveProperty("placeOwnerEmail");
        expect(deposition).toHaveProperty("placeId");
        expect(deposition.placeId).toHaveProperty("_id");
        expect(deposition.placeId).toHaveProperty("address");
        expect(deposition.placeId).toHaveProperty("geojson");
        expect(deposition.placeId).toHaveProperty("type");
    });
});
