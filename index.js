const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors')
const bodyParser = require('body-parser');
const server = http.createServer(app);
const mongoose = require('mongoose');
const Users = require('./models/UserModel');
const Rooms = require('./models/RoomModel');
const routes = require("./routes");
const playerUtils = require('./playerUtils');
const utils = require('./utils');

const numberOfAvailablePlayers = playerUtils.getNumberOfAvailablePlayers();

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        // methods: ["GET", "POST"]
    }
});

app.use(bodyParser.json());
app.use(cors());

// database connection
// mongoose.connect('mongodb://localhost:27017/realtimeProject',{useNewUrlParser:true},
mongoose.connect('mongodb://144.217.30.147:27017/realtimeProject',{useNewUrlParser:true},
    function(err){
        if (err) {
            throw err
        }
        console.log('Database connected');
        app.use("/api", routes);

        io.on('connection',(socket) => {
            console.log('user connected')
            socket.on('createUser',(data)=>{
                // Users
                const newUser = new Users({
                    _id: utils.makeid(24),
                    name: data?.name,
                    age: data?.age,
                });
                newUser.save((error) => {
                    if (error) {
                        console.log(error, 'error');
                    }
                });

                socket.join(newUser._id);

            });

            socket.on('joinOrCreateAndJoinRoom',(data)=>{      // data will look like => {myID: "123123"}
                console.log(data, 'datadata joinOrCreateAndJoinRoom');
                Rooms.findOne({ 'name': data?.name }, 'name historyP1 historyP2', function (err, room) {
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


            });

            console.log('a user connected', socket.id);

            // socket.join('randomRoom');

            socket.on('disconnect', () => {
                console.log('user disconnected', socket.id);
            });
            socket.on('chat message', (msg) => {
                console.log('started chat message')
                io.emit('chat message', msg);
            });

            socket.on('random running', (msg) => {
                console.log('started');
                if (msg?.status) {
                    setTimeout(async () => {
                        const roomData = await Rooms.findOne({ name: msg?.room });
                        let historyP1 = Object.values(roomData.historyP1);
                        let historyP2 = Object.values(roomData.historyP2);
                        let resetPlayers = historyP1.length >= numberOfAvailablePlayers;
                        if (resetPlayers) {
                            historyP1.splice(0, historyP1.length);
                            historyP2.splice(0, historyP2.length);
                        }
                        let randomPlayer1 = playerUtils.getRandomPlayer();
                        let randomPlayer2 = playerUtils.getRandomPlayer();
                        let doesExistsPlayer1 = historyP2.includes(randomPlayer1);
                        let doesExistsPlayer2 = historyP2.includes(randomPlayer2);

                        while(doesExistsPlayer1) {
                            randomPlayer1 = playerUtils.getRandomPlayer();
                            doesExistsPlayer1 = historyP1.includes(historyP1);
                        }

                        while(doesExistsPlayer2) {
                            randomPlayer2 = playerUtils.getRandomPlayer();
                            doesExistsPlayer2 = historyP2.includes(historyP2);
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

            });
            socket.on('random players', (msg) => {
                socket.to('randomRoom').emit('random players', msg);
            });
        })

        Users.watch().on('change',(change)=>{
            io.to(change.documentKey._id).emit('changes',change)
        });

        Rooms.watch().on('change',(change)=>{
            console.log('Something has changed in rooms', change);
            if (change?.operationType === 'insert') {
                io.to(change.fullDocument.name).emit('roomsChanged',change.fullDocument);
            } else if (change?.operationType === 'update') {
                Rooms.findOne({ '_id': change?.documentKey?._id }, 'name historyP1 historyP2', function (err, room) {
                    if (err) return console.log(err);
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
