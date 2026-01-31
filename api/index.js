const express = require("express");
const app = express();
const {dal, connectToDb, closeDb} = require("./dal/mongoDAL.js");
const {formatUsersList, formatGamesList, formatTradesList, checkForMissingFields, checkForNaNFields, checkForUnallowedFields} = require("./utils.js");
require('dotenv').config();
const INTERNAL_PORT = process.env.INTERNAL_PORT;
const PROXY_PORT = process.env.PROXY_PORT;

app.use(express.urlencoded({extended : true}));
app.use(express.json());


//#region /users endpoints
app.get("/users", async (req, res) => {
    let fullDetailUsersList = await dal.getAllUsers();
    if (fullDetailUsersList.length > 0) {
        let adjustedUsersList = formatUsersList(fullDetailUsersList);

        res.status(200).json({
            message : "Users list retrieved successfully",
            data : adjustedUsersList
        });
    } else {
        res.status(404).json({
            message : "No Users found",
            link : {
                url : `http://localhost:${PROXY_PORT}/users`,
                method : "POST"
            }
        });
    }
});

app.get("/users/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number user id`
        });
    }

    let user = await dal.getUserById(id);

    if (user) {
        let adjustedUser = {
            id : user.id,
            name : user.name,
            address : user.address,
            links : {
                url : `http://localhost:${PROXY_PORT}/users/${user.id}/games`,
                method : "GET"
            }
        }

        return res.status(200).json({
            message : "User retrieved successfully",
            data : adjustedUser
        });
    } else {
        return res.status(404).json({
            error : "Not Found",
            message : `User with id ${id} not found`
        });
    }
});

app.get("/users/:id/games", async (req, res) => {
    let id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number user id`
        });
    } else if (!(await dal.getUserById(id))) {
        return res.status(404).json({
            error : "Not Found",
            message : `User with id ${id} not found`
        });
    }

    let gamesList = await dal.getGamesByUserId(id);

    if (gamesList && gamesList.length > 0) {
        let adjustedGamesList = formatGamesList(gamesList);

        res.status(200).json({
            message : `User ${id} games list retrieved successfully`,
            data : adjustedGamesList
        });
    } else {
        res.status(200).json({
            message : `User ${id} games list empty`,
            link : {
                url : `http://localhost:${PROXY_PORT}/games`,
                method : "POST"
            }
        });
    }
}); 

app.post("/users", async (req, res) => {
    let body = req.body;
    console.log("Users POST body: ", body);

    let requiredFields = ["name", "email", "password", "address"];
    let missingFields = checkForMissingFields(body, requiredFields);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`
        });
    } 
        
    let newUser = {
        id : 0,
        name : body.name,
        email : body.email,
        password : body.password,
        address : body.address
    }

    result = await dal.createUser(newUser);

    if (result) {
        const {_id, ...createdUser} = result;

        res.status(201).json({
            message : "User created",
            data : createdUser,
            link : {
                url : `http://localhost:${PROXY_PORT}/users/${createdUser.id}`,
                method : "GET"
            }
        });
    }
});

app.patch("/users/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    let body = req.body;
    console.log("Users PATCH body: ", body);

    let name = body.name;
    let address = body.address;
    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number user id`
        });
    } else if (!(await dal.getUserById(id))) {
        return res.status(404).json({
            error : "Not Found",
            message : `User with id ${id} not found`
        });
    } else if (body.email || body.password) {
        return res.status(400).json({
            error : "Bad Request",
            message : "Email or password cannot be updated, only name or address can"
        });
    } else if (!name && !address) {
        return res.status(400).json({
            error : "Bad Request",
            message : "No name or address provided to update"
        });
    }

    let updateFields = {};

    if (name) {updateFields.name = name;}
    if (address) {updateFields.address = address;}

    let result = await dal.updateUser(id, updateFields);

    if (result) {
        return res.status(200).json({
            message : `User ${id}, partial update successfull`,
            link : {
                url : `http://localhost:${PROXY_PORT}/users/${id}`,
                method : "GET"
            }
        });
    } else {
        console.log("DAL updateUser unsuccessfull");
    }
});

app.delete("/users/:id", async (req, res) => {
    let id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number user id`
        });
    } else if (!(await dal.getUserById(id))) {
        return res.status(404).json({
            error : "Not Found",    
            message : `User with id ${id} not found`
        });
    }

    if (await dal.deleteUser(id)) {
        res.status(200).json({
            message: `User ${id} deleted successfully`,
            link : {
                url : `http://localhost:${PROXY_PORT}/users`,
                method : "POST"
            }
        });
    } else {
        console.log("DAL deleteUser unsuccessfull");
    }
});
//#endregion


//#region /games endpoints

app.get("/games", async (req, res) => {
    // Query string parameter implementation suggested by Gemini
    let query = {};
    if (req.query.name) {
        query.name = new RegExp(req.query.name, 'i');
    }  
    if (req.query.publisher) {
        query.publisher = new RegExp(req.query.publisher, 'i');        
    }
    if (req.query.year && !isNaN(parseInt(req.query.year))) {
        query.year = parseInt(req.query.year);
    }
    if (req.query.system) {
        query.system = new RegExp(req.query.system, 'i');
    }
    if (req.query.condition) {
        query.condition = new RegExp(req.query.condition, 'i');
    }
    if (req.query.ownerId && !isNaN(parseInt(req.query.ownerId))) {
        query.ownerId = parseInt(req.query.ownerId);
    }
    // End of Gemini assistance

    let fullDetailGamesList = await dal.getAllGames(query);
    if (fullDetailGamesList.length > 0) {
        let adjustedGamesList = formatGamesList(fullDetailGamesList);
    
        res.status(200).json({
            message : "Games list retrieved successfully",
            data : adjustedGamesList,
            link : {
                note : "Query string parameters available for filtering games",
                url : `http://localhost:${PROXY_PORT}/games?name=Mario&publisher=Nintendo&year=1996&system=64&condition=mint&ownerId=1`,
                method : "GET"
            }
        });
    } else {
        res.status(200).json({
            message : "Games list empty",
            link : {
                url : `http://localhost:${PROXY_PORT}/games`,
                method : "POST"
            }
        });
    }
});

app.get("/games/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number game id`
        });
    }

    let game = await dal.getGameById(id);

    if (game) {
        const {_id, ...adjustedGame} = game;
        adjustedGame.links = [
            {
                url : `http://localhost:${PROXY_PORT}/users/${game.ownerId}`,
                method : "GET"
            },
            {
                url : `http://localhost:${PROXY_PORT}/users/${game.ownerId}/games`,
                method : "GET"
            }
        ];
        
        res.status(200).json({
            message : "Game retrieved successfully",
            data : adjustedGame
        });
    } else {
        return res.status(404).json({
            error : "Not Found",
            message : `Game with id ${id} not found`
        });
    }
});

app.post("/games", async (req, res) => {
    let body = req.body;
    console.log("Games POST body: ", body);

    let requiredFields = ["name", "publisher", "year", "system", "condition", "ownerId"];
    let missingFields = checkForMissingFields(body, requiredFields);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`
        });
    } 

    let numberFields = ["year", "ownerId"];
    let NaNFields = checkForNaNFields(body, numberFields);

    if(NaNFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Fields must be valid numbers: ${NaNFields.join(", ")}`
        });
    }
        
    let newGame = {
        id : 0,
        name : body.name,
        publisher : body.publisher,
        year : parseInt(body.year),
        system : body.system,
        condition : body.condition,
        ownerId : parseInt(body.ownerId)
    }

    let result = await dal.createGame(newGame);

    if (result) {
        const {_id, ...createdGame} = result;
        res.status(201).json({
            message : "Game created successfully",
            data : createdGame,
            link : {
                    url : `http://localhost:${PROXY_PORT}/games/${createdGame.id}`,
                    method : "GET"
            }
        });
    }
});

app.put("/games/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    let body = req.body;
    console.log("Games PUT body: ", body);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number game id`
        });
    } else if (!(await dal.getGameById(id))) {
        return res.status(404).json({
            error : "Not Found",
            message : `Game with id ${id} not found`
        });
    }

    let requiredFields = ["name", "publisher", "year", "system", "condition", "ownerId"];
    let missingFields = checkForMissingFields(body, requiredFields);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`,
        });
    } 

    let numberFields = ["year", "ownerId"];
    let NaNFields = checkForNaNFields(body, numberFields);

    if(NaNFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Fields must be valid numbers: ${NaNFields.join(", ")}`
        });
    }

    let updateFields = {
        id : 0,
        name : body.name,
        publisher : body.publisher,
        year : parseInt(body.year),
        system : body.system,
        condition : body.condition,
        ownerId : parseInt(body.ownerId)
    }

    let result = await dal.updateGame(id, updateFields);

    if (result) {
        return res.status(200).json({
            message : `Game ${id}, full update successfull`,
            link : {
                url : `http://localhost:${PROXY_PORT}/games/${id}`,
                method : "GET"
            }
        });
    } else {
        console.log("DAL updateGame unsuccessfull");
    }
});

app.patch("/games/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    let body = req.body;
    console.log("Games PATCH body: ", body);

    let name = body.name;
    let publisher = body.publisher;
    let year = parseInt(body.year);
    let system = body.system;
    let condition = body.condition;
    let ownerId = body.ownerId;

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number game id`
        });
    } else if (!(await dal.getGameById(id))) {
        return res.status(404).json({
            error : "Not Found",
            message : `Game with id ${id} not found`
        });
    } else if (!name && !publisher && !year && !system && !condition && !ownerId) {
        return res.status(400).json({
            error : "Bad Request",
            message : "No valid fields provided to update"
        });
    }

    let updateFields = {};

    if (name) {updateFields.name = name;}
    if (publisher) {updateFields.publisher = publisher;}
    if (year) {updateFields.year = year;};
    if (system) {updateFields.system = system;};
    if (condition) {updateFields.condition = condition;};
    if (ownerId) {updateFields.ownerId = ownerId;};
    
    let result = await dal.updateGame(id, updateFields);

    if (result) {
        return res.status(200).json({
            message : `Game ${id}, partial update successfull`,
            link : {
                url : `http://localhost:${PROXY_PORT}/games/${id}`,
                method : "GET"
            }
        });
    } else {
        console.log("DAL updateGame unsuccessfull");
    }
});

app.delete("/games/:id", async (req, res) => {
    let id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number game id`
        });
    } else if (!(await dal.getGameById(id))) {
        return res.status(404).json({
            error : "Not Found",
            message : `Game with id ${id} not found`
        });
    }
    
    if (await dal.deleteGame(id)) {
        res.status(200).json({
            message: `Game ${id} deleted successfully`,
            link : {
                url : `http://localhost:${PROXY_PORT}/games`,
                method : "POST"
            }
        });
    } else {
        console.log("DAL deleteGame unsuccessful");
    }
});
//#endregion

//#region /trades endpoints





// GET /trades -- MUST filter by either a senderId or receiverID, can add more query params for extra filtering
app.get("/trades", async (req, res) => {
    let query = {};
    if (req.query.senderId && !isNaN(parseInt(req.query.senderId))) {
        query.senderId = parseInt(req.query.senderId);
    }  
    if (req.query.receiverId && !isNaN(parseInt(req.query.receiverId))) {
        query.receiverId = parseInt(req.query.receiverId);        
    }

    if (!query.senderId && !query.receiverId) {
        return res.status(400).json({
            error : "Bad Request",
            message : "Query paramaters must include either senderId or receiverId",
            link : {
                    url : `http://localhost:${PROXY_PORT}/trades?senderId=1`,
                    method : "GET"
            }
        });
    }

    if (req.query.status) {
        query.status = new RegExp(req.query.status, 'i');
    }

    let sort;
    if (req.query.sort) {
        let sortField = req.query.sort.replace('-', '');
        let direction = req.query.sort.startsWith('-') ? -1 : 1;
        sort[sortField] = direction;
    }

    let fullDetailTradesList = await dal.getTrades(query, sort);
    if (fullDetailTradesList.length > 0) {
        let gamesList = await dal.getAllGames({});
        let adjustedTradesList = formatTradesList(fullDetailTradesList, gamesList);
    
        res.status(200).json({
            message : "Trades list retrieved successfully",
            data : adjustedTradesList,
            link : {
                note : "Query string parameters available for filtering trades",
                url : `http://localhost:${PROXY_PORT}/trades?senderId=1&receiverId=2&status=pending&sort=-unixTimestamp`,
                method : "GET"
            }
        });
    } else {
        res.status(200).json({
            message : "Trades list empty",
            link : {
                url : `http://localhost:${PROXY_PORT}/trades`,
                method : "POST"
            }
        });
    }
});


// GET /trades/:id - return one specific trade with all of the data
app.get("/trades/:id", async (req, res) => {
    let id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number trade id`
        });
    }
    
    let trade = await dal.getTradeById(id);

    if (trade) {
        const {_id:mongoId1, ...senderGame} = await dal.getGameById(trade.senderGameId);
        const {_id:mongoId2, ...receiverGame} = await dal.getGameById(trade.receiverGameId);

        let adjustedTrade = {   
            id : trade.id,
            senderId : trade.senderId,
            senderGame : senderGame,
            receiverId : trade.receiverId,
            receiverGame : receiverGame,
            status : trade.status,
            created : trade.createdOn,
            links : [
                {
                    url : `http://localhost:${PROXY_PORT}/trades/${trade.id}`,
                    method : "PATCH"
                },
                {
                    url : `http://localhost:${PROXY_PORT}/users/${trade.senderId}`,
                    method : "GET"
                },
                {
                    url : `http://localhost:${PROXY_PORT}/users/${trade.receiverId}`,
                    method : "GET"
                }
            ]
        }
        
        res.status(200).json({
            message : "Trade retrieved successfully",
            data : adjustedTrade
        });
    } else {
        return res.status(404).json({
            error : "Not Found",
            message : `Trade with id ${id} not found`
        });
    }
});



// POST /trades - create new trade offer to another user -> Vaidating that both Users exist and own the respective games
app.post("/trades", async (req, res) => {
    let body = req.body;
    console.log("Trades POST body: ", body);

    let senderId = body.senderId;
    let senderGameId = body.senderGameId;
    let receiverId = body.receiverId;
    let receiverGameId = body.receiverGameId;

    let requiredFields = ["senderId", "senderGameId", "receiverId", "receiverGameId"];
    let missingFields = checkForMissingFields(body, requiredFields);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`
        });
    } 

    let numberFields = ["senderId", "senderGameId", "receiverId", "receiverGameId"];
    let NaNFields = checkForNaNFields(body, numberFields);

    if(NaNFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Fields must be number ids: ${NaNFields.join(", ")}`
        });
    }

    let sender = await dal.getUserById(senderId);
    if (!sender) {
        return res.status(400).json({
            error : "Bad Request",
            message : `User with id ${senderId} does not exist`
        });
    }
    let receiver = await dal.getUserById(receiverId);
    if (!receiver) {
        return res.status(400).json({
            error : "Bad Request",
            message : `User with id ${receiverId} does not exist`
        });
    }

    let senderGame = await dal.getGameById(senderGameId);
    if (!senderGame) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Game with id ${senderGameId} does not exist`
        });
    }
    
    let receiverGame = await dal.getGameById(receiverGameId);
    if (!receiverGame) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Game with id ${receiverGameId} does not exist`
        });
    }

    if (senderGame.ownerId != senderId) {
        return res.status(400).json({
            error : "Bad Request",
            message : `User ${senderId} does not own Game ${senderGameId}`
        });
    }
    if (receiverGame.ownerId != receiverId) {
        return res.status(400).json({
            error : "Bad Request",
            message : `User ${receiverId} does not own Game ${receiverGameId}`
        });
    }
  
    let newTrade = {
        id : 0,
        senderId : parseInt(senderId),
        senderGameId : parseInt(senderGameId),
        receiverId : parseInt(receiverId),
        receiverGameId : parseInt(receiverGameId),
        status : "Pending",
        unixTimestamp : 0,
        createdOn : ""
    }

    let result = await dal.createTrade(newTrade);

    if (result) {
        const {_id, ...createdTrade} = result;
        res.status(201).json({
            message : "Trade created successfully",
            data : createdTrade,
            link : {
                    url : `http://localhost:${PROXY_PORT}/trades/${createdTrade.id}`,
                    method : "GET"
            }
        });
    }
});


// PATCH /trades/:id - update status of a trade -> only from pending to accepted/rejected, finalized trades cannot change state
app.patch("/trades/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    console.log("Trades PATCH body: ", req.body)
    let status = req.body.status;

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number trade id`
        });
    }

    const unallowedFields = ["senderId", "senderGameId", "receiverId", "receiverGameId", "unixTimestamp", "created"];
    let blockedFields = checkForUnallowedFields(req.body, unallowedFields);
    if (blockedFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Fields: {${blockedFields.join(", ")}} are not allowed. Only status field can be updated to 'Accepted' or 'Refused'. Delete Trade if erroneous.`
        });
    }
    
    let trade = await dal.getTradeById(id);
    if (!trade) {
        return res.status(404).json({
            error : "Not Found",
            message : `Trade with id ${id} not found`
        });
    } else if (trade.status != "Pending") {
        return res.status(400).json({
            error : "Bad Request",
            message : `Trade with id ${id} has already been ${trade.status}, only Pending Trades can be modified.`
        });
    }

    if (!status || (status != "Accepted" && status != "Rejected")) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Status field is required and must be set to "Accepted" or "Refused".`
        });
    }
    
    let updateField = {
        status : req.body.status
    };

    let result = await dal.updateTrade(id, updateField);

    if (result) {
        if (status == "Accepted") {
            let game1UpdateField = {
                ownerId : trade.receiverId
            };
            await updateGame(senderGameId, game1UpdateField);

            let game2UpdateField = {
                ownerId : trade.senderId
            };
            await updateGame(receiverGameId, game2UpdateField);
        }
        return res.status(200).json({
            message : `Trade ${id}, status update successfull`,
            link : {
                url : `http://localhost:${PROXY_PORT}/trades/${id}`,
                method : "GET"
            }
        });
    } else {
        console.log("DAL updateTrade unsuccessfull");
    }
});


// DELETE /trades/:id - cancel a trade -> only if it has not been accepted already
app.delete("/trades/:id", async (req, res) => {
    let id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${req.params.id} is not a valid number trade id`
        });
    }
    let trade = await dal.getTradeById(id);
    if (!trade) {
        return res.status(404).json({
            error : "Not Found",
            message : `Trade with id ${id} not found`
        });
    } else if (trade.status != "Pending") {
        return res.status(400).json({
            error : "Bad Request",
            message : `Trade offer with id ${id} has already been ${trade.status}, only Pending Trades can be cancelled.`
        });
    }

    let deleteSuccessfull = await dal.deleteTrade(id);

    if (deleteSuccessfull) {
        res.status(200).json({
            message: `Trade offer ${id} canceled successfully`,
            link : {
                url : `http://localhost:${PROXY_PORT}/trades`,
                method : "POST"
            }
        });
    } else {
        console.log("DAL deleteTrade unsuccessful");
    }
});

//#endregion


//TODO:
// This will be added next Lab
// We need to be able to send a user notifications when they receive an offer for a game ( sending them emails in this case )
// Message streams w/ Kafka 
// Non-linear behaviors (no longer just following one event through from start to end)
// Message stream houses our events, and we can have services publish events to the message stream, and other services can subscribe to listen for a certain type of events in the stream
// Our API's are doing too much, and so we need to extract portions out into different services.
// The notifications is one example, as this is not a concern that the API should handle
// Excercise to do before Monday: Get a Kafka container up and running



//DB connection handling improved with Gemini
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing DB connection...');
    await closeDb();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Closing DB connection...');
    await closeDb();
    process.exit(0);
});

process.once('SIGUSR2', async () => {
    console.log('Nodemon restart detected. Closing DB connection...');
    await closeDb();
    process.kill(process.pid, 'SIGUSR2'); 
});

connectToDb().then(() => {
    app.listen(INTERNAL_PORT, () => {
        console.log("Server listening at http://localhost:"+INTERNAL_PORT);
    });
}).catch(err => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
})
// End of Gemini-assisted code




