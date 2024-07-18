import express from "express";
import { fetchOverpass } from "../services/overpass.js";
const router = express.Router();

router.post("/", async (req, res) => {
    const { coords, distance = 125, sortFromCoordinates = null } = req.body;
    console.log("body", req.body);
    console.log(coords, distance, sortFromCoordinates);
    const places = await fetchOverpass(coords, distance);
    console.log("places", places);
    return res.json({ result: true, data: places });
});

export default router;
