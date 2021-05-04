const Room = require("../models/RoomModel");


const getRooms = async (req, res) => {
    const posts = await Room.find();
    res.send(posts);
}
const getRoomByName = async (req, res) => {
    const room = await Room.findOne({ name: req.params.name });
    res.send(room);
}

module.exports = {
    getRoomByName,
    getRooms,
};
