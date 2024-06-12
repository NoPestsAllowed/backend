const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "NoPestsAllowed API",
        description: "Backend endpoints for NoPestsAllowed",
    },
    host: "192.168.1.17:3000",
    definitions: {
        User: {
            _id: "6659d91232ca8503efe37500",
            firstname: "Bob",
            lastname: "Letesteur ",
            email: "bob@test.test",
            password: "$2a$10$c1U8Ok9fGHDLz5TuqhThzeMO9/bBFDFLQ/GY0ip7Ex.zqQdNXkCvK",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvYkB0ZXN0LnRlc3QiLCJpZCI6IjY2NTlkOTEyMzJjYTg1MDNlZmUzNzUwMCIsImlhdCI6MTcxNzE2NDMwNn0.LC5EHwJPhV0fc3RlveoaIiLeP0IYOFKIo_FhPSGpnE4",
            createdAt: "2024-05-31T14:05:06.830Z",
        },
        Geojson: {
            type: "Point",
            coordinates: [48.887552, 2.303735],
        },
        Place: {
            _id: "6659cabfdb384223ae51ce49",
            address: "56 Boulevard Pereire",
            geojson: {
                $ref: "#/definitions/Geojson",
            },
            type: "Place",
            uniqRef: "3290452184",
        },
        VisualProof: {
            url: "https://res.cloudinary.com/ds2fqbtai/image/upload/v1717160639/g7ofjv9lndzynetosmn0.jpg",
            longitude: 2.303735,
            latitude: 48.887552,
            location: {
                $ref: "#/definitions/Geojson",
            },
            takenAt: "2024-05-31T13:04:00.476Z",
            _id: "6659cac0db384223ae51ce4d",
        },
        Deposition: {
            _id: "6659cac0db384223ae51ce4c",
            name: "Valide",
            description: "Y a des cafards ",
            placeOwnerEmail: "test@test.test",
            userId: "6659c984db384223ae51ce11",
            placeId: { $ref: "#/definitions/Place" },
            visualProofs: [
                {
                    $ref: "#/definitions/VisualProof",
                },
            ],
            status: "accepted",
            type: "cafard",
            createdAt: "2024-05-31T13:04:00.477Z",
        },
    },
};

const outputFile = "./swagger-output.json";
const routes = ["app.js"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);
