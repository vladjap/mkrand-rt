const playerUtils = require('../playerUtils');
const Rooms = require('../models/RoomModel');
const numberOfAvailablePlayers = playerUtils.getNumberOfAvailablePlayers();
module.exports = (io) => {

    const randomRunning = function (msg) {
        const socket = this;
        if (msg?.status) {
            setTimeout(async () => {
                const roomData = await Rooms.findOne({name: msg?.room});
                let historyP1 = Object.values(roomData?.historyP1);
                let historyP2 = Object.values(roomData?.historyP2);
                let resetPlayers = historyP1.length >= numberOfAvailablePlayers;
                if (resetPlayers) {
                    historyP1.splice(0, historyP1.length);
                    historyP2.splice(0, historyP2.length);
                }
                let randomPlayer1 = playerUtils.getRandomPlayer();
                let randomPlayer2 = playerUtils.getRandomPlayer();
                let doesExistsPlayer1 = historyP1.includes(randomPlayer1);
                let doesExistsPlayer2 = historyP2.includes(randomPlayer2);

                while (doesExistsPlayer1) {
                    randomPlayer1 = playerUtils.getRandomPlayer();
                    doesExistsPlayer1 = historyP1.includes(randomPlayer1);
                }

                while (doesExistsPlayer2) {
                    randomPlayer2 = playerUtils.getRandomPlayer();
                    doesExistsPlayer2 = historyP2.includes(randomPlayer2);
                }

                const randomData = {player1: randomPlayer1, player2: randomPlayer2};

                historyP1.push(randomPlayer1);
                historyP2.push(randomPlayer2);

                roomData.historyP1 = historyP1;
                roomData.historyP2 = historyP2;
                roomData.save();

                io.to(msg?.room).emit('random players', {
                    randomData,
                    resetPlayers,
                    historyP1,
                    historyP2,
                    room: msg?.room
                });

                socket.to(msg?.room).emit('random running', {
                    status: false
                });

            }, 2000);
        }
        socket.to(msg?.room).emit('random running', msg);
    };

    return {
        randomRunning
    }
}
