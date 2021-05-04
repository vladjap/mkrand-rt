const Users = require('./models/UserModel');
const Rooms = require('./models/RoomModel');

module.exports = (io) => {
    const initDbWatchers = function() {
        initUsersWatcher();
        initRoomsWatcher();
    };

    const initUsersWatcher = function() {
        Users.watch().on('change', (change) => {
            io.to(change.documentKey._id).emit('changes', change)
        });
    };

    const initRoomsWatcher = function() {
        Rooms.watch().on('change', (change) => {
            // console.log('Something has changed in rooms', change);
            if (change?.operationType === 'insert') {
                io.to(change.fullDocument.name).emit('roomsChanged', change.fullDocument);
            } else if (change?.operationType === 'update') {
                Rooms.findOne({'_id': change?.documentKey?._id}, 'name historyP1 historyP2', function (err, room) {
                    if (err) return console.log(err);
                    if (room) {
                        io.to(room.name).emit('roomsChanged', room);
                    }
                });
            }
        });
    }

    return {
        initDbWatchers
    }
}
