const lodash = require('lodash');
const PlayersData = require('./data');

const random = lodash.random;
const head = lodash.head;

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

module.exports = {
    getAvailablePlayers,
    getNumberOfAvailablePlayers,
    getRandomPlayer,
    getPlayerById,
};
