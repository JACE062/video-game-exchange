require('dotenv').config();
const PROXY_PORT = process.env.PROXY_PORT;

let formatUsersList = function (usersList) {
    let adjustedUsersList = [];
    for (user of usersList) {
        adjustedUser = {
            id : user.id,
            name : user.name,
            link : {
                url : `http://localhost:${PROXY_PORT}/users/${user.id}`,
                method : "GET"
            }
        }
        adjustedUsersList.push(adjustedUser);
    }
    return adjustedUsersList;
}

let formatGamesList = function (gamesList) {
    let adjustedGamesList = [];
    for (game of gamesList) {
        let adjustedGame = {
            id : game.id,
            name : game.name,
            year : game.year,
            ownerId : game.ownerId,
            link : {
                url : `http://localhost:${PROXY_PORT}/games/${game.id}`, 
                method : "GET"
            }
        } 
        adjustedGamesList.push(adjustedGame);
    }
    return adjustedGamesList;
}

let convertListToIdArray = function (list) {
    let idArray = [];
    for (item of list) {
        idArray.push(item.id)
    }
    return idArray;
}

// TODO: Would be nicer to have the game information display, rather than just giving them the game id and expecting them to check each one by hand
let formatTradesList = function (tradesList, gamesList) {
    let gamesIdArray = convertListToIdArray(gamesList);

    let adjustedTradesList = [];
    for (trade of tradesList) {
        let adjustedTrade = {
            id : trade.id,
            senderId : trade.senderId,
            senderGameName : gamesList[gamesIdArray.indexOf(trade.senderGameId)].name,
            receiverId : trade.receiverId,
            receiverGameName : gamesList[gamesIdArray.indexOf(trade.receiverGameId)].name,
            status : trade.status,
            created : trade.createdOn,
            link : {
                url : `http://localhost:${PROXY_PORT}/trades/${trade.id}`, 
                method : "GET"
            }
        }
        adjustedTradesList.push(adjustedTrade);
    }
    return adjustedTradesList;
}

// This method generated with Gemini
let checkForMissingFields = function (body, requiredFieldsList) {
    let missingFields = [];

    for (field of requiredFieldsList) {
        if (!body[field]) {
            missingFields.push(field);
        }
    }
    return missingFields;
}
// End of generated content

let checkForNaNFields = function (body, fieldsList) {
    let NaNFields = [];

    for (field of fieldsList) {
        if (isNaN(parseInt(body[field]))) {
            NaNFields.push(field);
        }
    }
    return NaNFields;
}

let checkForUnallowedFields = function (body, unallowedFieldsList) {
    let unallowedFields = [];
    for (field of unallowedFieldsList) {
        if (body[field]) {
            unallowedFields.push(field);
        }
    }
    return unallowedFields;
}

exports.formatUsersList = formatUsersList;

exports.formatGamesList = formatGamesList;

exports.formatTradesList = formatTradesList;

exports.checkForMissingFields = checkForMissingFields;

exports.checkForNaNFields = checkForNaNFields;

exports.checkForUnallowedFields = checkForUnallowedFields;