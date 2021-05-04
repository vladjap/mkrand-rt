const Rooms = require('../models/RoomModel');
const utils = require('../utils');
module.exports = (io) => {
    const joinOrCreateAndJoinRoom = function (data) {
        const socket = this; // hence the 'function' above, as an arrow function will not work
        // console.log(data, 'datadata joinOrCreateAndJoinRoom');
        Rooms.findOne({'name': data?.name}, 'name historyP1 historyP2', function (err, room) {
            if (err) return console.log(err);
            // console.log(room, 'room');

            if (!room) {
                const newRoom = new Rooms({
                    _id: utils.makeid(24),
                    name: data?.name,
                    historyP1: [],
                    historyP2: [],
                });
                newRoom.save((error) => {
                    if (error) {
                        console.log(error, 'error');
                    }
                });

                socket.join(newRoom.name);
            } else {
                socket.join(room.name);
            }
        });
    };

    const readOrder = function (orderId, callback) {
        // ...
    };

    return {
        joinOrCreateAndJoinRoom,
        readOrder
    }
}
