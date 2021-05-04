const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    _id: String,
    name: String,
    historyP1: [String],
    historyP2: [String],
});

module.exports = mongoose.model('Rooms',RoomSchema);
