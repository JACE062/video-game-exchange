require('dotenv').config();
const PORT = process.env.PORT;

let formatUsersList = function (usersList) {
    let adjustedUsersList = [];
    for (user of usersList) {
        adjustedUser = {
            id : user.id,
            name : user.name,
            link : {
                url : `http://localhost:${PORT}/users/${user.id}`,
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
                url : `http://localhost:${PORT}/games/${game.id}`, 
                method : "GET"
            }
        } 
        adjustedGamesList.push(adjustedGame);
    }
    return adjustedGamesList;
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


exports.formatUsersList = formatUsersList;

exports.formatGamesList = formatGamesList;

exports.checkForMissingFields = checkForMissingFields;