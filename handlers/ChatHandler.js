module.exports = (io) => {

    const chatMessage = function (msg) {
        // console.log('started chat message')
        io.emit('chat message', msg);
    };

    return {
        chatMessage
    }
}
