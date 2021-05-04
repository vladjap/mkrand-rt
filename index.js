const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors')
const bodyParser = require('body-parser');
const server = http.createServer(app);
const mongoose = require('mongoose');

const routes = require("./routes");


const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        // methods: ["GET", "POST"]
    }
});

const { joinOrCreateAndJoinRoom } = require('./handlers/RoomHandler')(io);
const { chatMessage } = require('./handlers/ChatHandler')(io);
const { randomRunning } = require('./handlers/RandomHandler')(io);

const { initDbWatchers } = require('./dbWatchers')(io);

app.use(bodyParser.json());
app.use(cors());

const onDisconnect = () => {}

const onConnection = (socket) => {
    socket.on('joinOrCreateAndJoinRoom', joinOrCreateAndJoinRoom);
    socket.on('chat message', chatMessage);
    socket.on('random running', randomRunning);
    socket.on('disconnect', onDisconnect);
};

const application = (err) => {
    if (err) {
        throw err
    }
    console.log('Database connected');
    // API router
    app.use("/api", routes);

    // Socket IO connection event
    io.on('connection', onConnection);

    // Init watchers for DB documents. (Mongo send event when something is changed)
    initDbWatchers();

}

// database connection
mongoose.connect(
    'mongodb://localhost:27017/realtimeProject',
    {useNewUrlParser: true},
    application, // application will run only if there is connection to DB
)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT ? process.env.PORT : 3000;
server.listen(PORT, () => {
    console.log('listening on *:' + PORT);
});
