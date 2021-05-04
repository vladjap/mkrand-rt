const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors')
const bodyParser = require('body-parser');
const server = http.createServer(app);
const mongoose = require('mongoose');
const lodash = require('lodash');
const random = lodash.random;
const head = lodash.head;
const PlayersData = require('./data');
const Users = require('./models/UserModel');
const Rooms = require('./models/RoomModel');
const routes = require("./routes") // new

const getAvailablePlayers = () => {
    if (!PlayersData) {
        return null;
    }
    return PlayersData.filter(playerItem => playerItem?.available);
}

const getNumberOfAvailablePlayers = () => {
    const availablePlayers = getAvailablePlayers();
    if (!availablePlayers) {
        return 0;
    }
    return availablePlayers.length;
}

const getRandomPlayer = () => {
    const avPlayerIds = PlayersData.filter(player => player?.available).map(player => player?.id);
    return avPlayerIds[random(0, avPlayerIds.length - 1)];
}

const getPlayerById = (id) => {
    if (!id) {
        return null;
    }
    const playerArray = PlayersData.filter(player => player?.id === id);
    if (!playerArray || playerArray.length === 0) {
        return null;
    }
    return head(playerArray);
}
const numberOfAvailablePlayers = getNumberOfAvailablePlayers();

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        // methods: ["GET", "POST"]
    }
});

function makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

// console.log(makeid(5));

app.use(bodyParser.json());
app.use(cors());

// database connection

mongoose.connect('mongodb://localhost:27017/realtimeProject',{useNewUrlParser:true},
    function(err){
        if(err){
            throw err
        }
        console.log('Database connected');

        // app.get('/get-room-data/:roomName', (req, res) => {
        //     res.json({
        //         roomName: req.params?.roomName
        //     })
        // });

        app.use("/api", routes)

        io.on('connection',(socket) => {
            console.log('user connected')
            socket.on('createUser',(data)=>{
                // Users
                const newUser = new Users({
                    _id: makeid(24),
                    name: data?.name,
                    age: data?.age,
                });
                newUser.save((error) => {
                    if (error) {
                        // throw new Error('new user failed saving', error);
                        console.log(error, 'error');
                    }
                });

                // console.log(newUser, 'newUser');

                socket.join(newUser._id);

            });


            //Rooms
            socket.on('joinOrCreateAndJoinRoom',(data)=>{      // data will look like => {myID: "123123"}
                console.log(data, 'datadata joinOrCreateAndJoinRoom');
                Rooms.findOne({ 'name': data?.name }, 'name historyP1 historyP2', function (err, room) {
                    if (err) return console.log(err);
                    // console.log(room, 'room');

                    if (!room) {
                        const newRoom = new Rooms({
                            _id: makeid(24),
                            name: data?.name,
                            historyP1: [],
                            historyP2: [],
                        });
                        newRoom.save((error) => {
                            if (error) {
                                // throw new Error('new user failed saving', error);
                                console.log(error, 'error');
                            }
                        });

                        // console.log(newRoom, 'newRoom');

                        socket.join(newRoom.name);
                    } else {
                        socket.join(room.name);
                    }
                });


            });

            // socket.on('updateRoomHistory', data => {
            //     const filter = { name:  data?.name};
            //     const update = { historyP1: data?.historyP1, historyP2: data?.historyP2 };
            //
            //     Rooms.findOneAndUpdate(filter, update).then(p => console.log(p, '<-----'));
            //
            // });


            //OLD:

            console.log('a user connected', socket.id);

            // socket.join('randomRoom');

            socket.on('disconnect', () => {
                console.log('user disconnected', socket.id);
            });
            const historyPlayer1 = [];
            const historyPlayer2 = [];
            // socket.on('chat message', (msg) => {
            //     console.log('message: ' + msg);
            // });

            // socket.on('join', (room) => {
            //     console.log(`Socket ${socket.id} joining ${room}`);
            //     socket.join(room);
            // });
            socket.on('chat message', (msg) => {
                console.log('started chat message')
                io.emit('chat message', msg);
            });

            socket.on('random running', (msg) => {
                // console.log(data, 'data')
                // const { message: msg, room} = data;
                console.log('started');
                if (msg?.status) {
                    // const { message, room } = data;
                    // console.log(`msg: ${message}, room: ${room}`);
                    // io.to(room).emit('chat', message);
                    console.log(msg, 'MSG');
                    setTimeout(async () => {
                        const roomData = await Rooms.findOne({ name: msg?.room });
                        let historyP1 = Object.values(roomData.historyP1);
                        let historyP2 = Object.values(roomData.historyP2);
                        console.log( Object.values(historyP1), 'historyP1 toto');
                        let resetPlayers = historyP1.length >= numberOfAvailablePlayers;
                        console.log(resetPlayers, 'resetPlayers');
                        if (resetPlayers) {
                            historyP1.splice(0, historyP1.length);
                            historyP2.splice(0, historyP2.length);
                        }
                        let randomPlayer1 = getRandomPlayer();
                        let randomPlayer2 = getRandomPlayer();
                        let doesExistsPlayer1 = historyP2.includes(randomPlayer1);
                        let doesExistsPlayer2 = historyP2.includes(randomPlayer2);

                        while(doesExistsPlayer1) {
                            randomPlayer1 = getRandomPlayer();
                            doesExistsPlayer1 = historyP1.includes(historyP1);
                        }

                        while(doesExistsPlayer2) {
                            randomPlayer2 = getRandomPlayer();
                            doesExistsPlayer2 = historyP2.includes(historyP2);
                        }

                        const randomData = {player1: randomPlayer1, player2: randomPlayer2};
                        // const doesExists = history.filter(historyItem => lodash.isEqual(historyItem, random))
                        // if (history.inc)
                        // if (!doesExists) {

                        historyP1.push(randomPlayer1);
                        historyP2.push(randomPlayer2);


                        // }

                        // io.emit('random players', {
                        //     randomData,
                        //     resetPlayers,
                        //     historyPlayer1,
                        //     historyPlayer2,
                        // });

                        roomData.historyP1 = historyP1;
                        roomData.historyP2 = historyP2;
                        roomData.save();
                        // roomData.update()
                        console.log(roomData, 'roomData');

                        // console.log('DA DA DA', {
                        //     randomData,
                        //     resetPlayers,
                        //     historyPlayer1,
                        //     historyPlayer2,
                        //     room: msg?.room
                        // });
                        io.to(msg?.room).emit('random players', {
                            randomData,
                            resetPlayers,
                            historyP1,
                            historyP2,
                            room: msg?.room
                        });
                        // io.emit('random running', false);
                        socket.to(msg?.room).emit('random running', {
                            status: false
                        });
                        // history.push(randomData);
                        // console.log(historyPlayer1, 'historyPlayer1');
                        // console.log(historyPlayer2, 'historyPlayer2');
                    }, 2000);
                }
                socket.to(msg?.room).emit('random running', msg);

            });
            socket.on('random players', (msg) => {
                // io.emit('random players', msg);
                console.log(msg, 'msgmsgmsgmsgmsgmsg');
                socket.to('randomRoom').emit('random players', msg);
            });

            // console.log(socket.rooms, "rooms");

        })

        Users.watch().on('change',(change)=>{
            // console.log('Something has changed', change)
            io.to(change.documentKey._id).emit('changes',change)
        });

        Rooms.watch().on('change',(change)=>{
            console.log('Something has changed in rooms', change);
            if (change?.operationType === 'insert') {
                io.to(change.fullDocument.name).emit('roomsChanged',change.fullDocument);
            } else if (change?.operationType === 'update') {
                Rooms.findOne({ '_id': change?.documentKey?._id }, 'name historyP1 historyP2', function (err, room) {
                    if (err) return console.log(err);
                    // console.log(room, 'room');
                    if (room) {
                        io.to(room.name).emit('roomsChanged', room);
                    }
                });
            }

        });

    })

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT ? process.env.PORT : 3000;
server.listen(PORT, () => {
    console.log('listening on *:' + PORT);
});
