const express = require("express");
const app = express();
const {dal} = require("./dal/mongoDAL.js");
const {formatUsersList, formatGamesList, checkForMissingFields} = require("./utils.js");
require('dotenv').config();
const PORT = process.env.PORT;

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
                url : `http://localhost:${PORT}/users`,
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
                url : `http://localhost:${PORT}/users/${user.id}/games`,
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
                url : `http://localhost:${PORT}/games`,
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
                url : `http://localhost:${PORT}/users/${createdUser.id}`,
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
                url : `http://localhost:${PORT}/users/${id}`,
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
                url : `http://localhost:${PORT}/users`,
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
    // End of Gemini assistance

    let fullDetailGamesList = await dal.getAllGames(query);
    if (fullDetailGamesList.length > 0) {
        let adjustedGamesList = formatGamesList(fullDetailGamesList);
    
        res.status(200).json({
            message : "Games list retrieved successfully",
            data : adjustedGamesList,
            link : {
                note : "Query string parameters available for filtering games",
                url : `http://localhost:${PORT}/games?name=Mario&publisher=Nintendo&year=1996&system=64&condition=mint`,
                method : "GET"
            }
        });
    } else {
        res.status(200).json({
            message : "Games list empty",
            link : {
                url : `http://localhost:${PORT}/games`,
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
                url : `http://localhost:${PORT}/users/${game.ownerId}`,
                method : "GET"
            },
            {
                url : `http://localhost:${PORT}/users/${game.ownerId}/games`,
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
        
    let newGame = {
        name : body.name,
        publisher : body.publisher,
        year : parseInt(body.year),
        system : body.system,
        condition : body.condition,
        ownerId : body.ownerId
    }

    let result = await dal.createGame(newGame);

    if (result) {
        const {_id, ...createdGame} = result;
        res.status(201).json({
            message : "Game created successfully",
            data : createdGame,
            link : {
                    url : `http://localhost:${PORT}/games/${createdGame.id}`,
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

    let updateFields = {
        name : body.name,
        publisher : body.publisher,
        year : parseInt(body.year),
        system : body.system,
        condition : body.condition,
        ownerId : body.ownerId
    }

    let result = await dal.updateGame(id, updateFields);

    if (result) {
        return res.status(200).json({
            message : `Game ${id}, full update successfull`,
            link : {
                url : `http://localhost:${PORT}/games/${id}`,
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
                url : `http://localhost:${PORT}/games/${id}`,
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
                url : `http://localhost:${PORT}/games`,
                method : "POST"
            }
        });
    } else {
        console.log("DAL deleteGame unsuccessful");
    }
});
//#endregion







app.listen(PORT, () => {
    console.log("Server listening at http://localhost:"+PORT);
});





