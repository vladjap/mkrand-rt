const express = require("express")
const router = express.Router();
const Room = require("../models/RoomModel");
const rooms = require('./rooms');

// ROOMS
router.get("/rooms", rooms.getRooms)
router.get("/rooms/:name", rooms.getRoomByName);

module.exports = router;
