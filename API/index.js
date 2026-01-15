const express = require("express");
const app = express();
const {dal} = require("./../dal/mongoDAL.js");
const PORT = 5000;

app.use(express.urlencoded({extended : true}));
app.use(express.json());

let gamesList = [];
let usersList = [];

app.post("/games", (req, res) => {
    let body = req.body;
    console.log("Games POST body: ", body);

    let requiredFields = ["name", "publisher", "year", "system", "condition", "ownerId"];
    let missingFields = [];

    for (field of requiredFields) {
        if (!body[field]) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`
        });
    } 
        
    let newGame = {
        name : body.name,
        publisher : body.publisher,
        year : body.year,
        system : body.system,
        condition : body.condition,
        ownerId : body.ownerId
    }

    gamesList.push(newGame);

    res.status(201).json({
        message : "Game created",
        data : newGame
    });
});

app.put("/games/:id", async (req, res) => {
    let id = req.params.id;
    let body = req.body;
    console.log("Games PUT body: ", body);

    let requiredFields = ["name", "publisher", "year", "system", "condition", "ownerId"];
    let missingFields = [];

    for (field of requiredFields) {
        if (!body[field]) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        return res.status(400).json({
            error : "Bad Request",
            message : `Missing required fields: ${missingFields.join(", ")}`
        });
    } 

    let updatedGame = {
        name : body.name,
        publisher : body.publisher,
        year : body.year,
        system : body.system,
        condition : body.condition,
        ownerId : body.ownerId
    }
    
    if (await dal.updateGame(updatedGame)) {
        return res.status(200).json({
        message : `Game ${id}, full update successfull`,
        data : game
        });
    }

    res.status(404).json({
        error : "Not Found",
        message : `Game with id ${id} not found`
    });
});

app.patch("/games/:id", (req, res) => {
    let id = req.params.id;
    let body = req.body;
    console.log("Games PATCH body: ", body);

    for (game of gamesList) {
        if (game.id == id) {
            game.name = body.name ? body.name : game.name;
            game.publisher = body.publisher ? body.publisher : game.publisher;
            game.year = body.year ? body.year : game.year;
            game.system = body.system ? body.system : game.system;
            game.condition = body.condition ? body.condition : game.condition;
            
            return res.status(200).json({
                message : `Game ${id}, partial update successfull`,
                data : game
            });
        }
    }

    res.status(404).json({
        error : "Not Found",
        message : `Game with id ${id} not found`
    });
});

app.delete("/games/:id", (req, res) => {
    let id = req.params.id;

    let tempLength = gamesList.length;
    gamesList = gamesList.filter(game => game.id != id);

    if (gamesList.length < tempLength) {
        res.status(200).json({message: `Game ${id} deleted successfully`});
    } else {
        res.status(404).json({
            error : "Not Found",
            message : `Game with id ${id} not found`
        });
    }
});


app.get("/users", async (req, res) => {
    let fullDetailUsers = await dal.getAllUsers();
    let adjustedUsers = [];
    for (user of fullDetailUsers) {
        adjustedUser = {
            id : user.id,
            name : user.name,
            link : {
                url : `http://localhost:5000/users/${user.id}`,
                method : "GET"
            }
        }
        adjustedUsers.push(adjustedUser);
    }

    res.status(200).json({
        message : "Users list retrieved successfully",
        data : adjustedUsers
    });
});

app.post("/users", async (req, res) => {
    let body = req.body;
    console.log("Users POST body: ", body);

    let requiredFields = ["name", "email", "password", "address"];
    let missingFields = [];

    for (field of requiredFields) {
        if (!body[field]) {
            missingFields.push(field);
        }
    }

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

    let newUserId = await dal.createUser(newUser);

    res.status(201).json({
        message : "User created",
        data : newUser,
        links : [
            {
                url : `http://localhost:5000/users/${newUserId}`,
                method : "GET"
            },
            {
                url : `http://localhost:5000/users/${newUserId}`,
                method : "PATCH"
            }
        ]
    });
});

app.get("/users/:id", async (req, res) => {
    let id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({
            error : "Bad Request",
            message : `${id} is not a valid number user id`
        });
    }

    let user = await dal.getUserById(id);

    let adjustedUser = {
        id : user.id,
        name : user.name,
        address : user.address,
        links : [
            {
                url : `http://localhost:5000/users/${user.id}`,
                method : "PATCH"
            },
            {
                url : `http://localhost:5000/users/${user.id}/games`,
                method : "GET"
            }
        ]
    }

    res.status(200).json({
        message : "User retrieved successfully",
        data : adjustedUser
    });

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

    
    let updatedUser;

    if (name && address) {
        updatedUser = {
            id : id,
            name : name,
            address : address
        }
    } else if (name) {
        updatedUser = {
            id : id,
            name : name
        }
    } else if (address) {
        updatedUser = {
            id : id,
            address : address
        }
    }

    if (await dal.updateUser(id, updatedUser)) {
        return res.status(200).json({
            message : `User ${id}, partial update successfull`,
            data : user,
            link : {
                url : `http://localhost:5000/users/${id}`,
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
    } else if ((await dal.getUserById(id)).length == 0) {
        return res.status(404).json({
            error : "Not Found",
            message : `User with id ${id} not found`
        });
    }

    if (await dal.deleteUser(id)) {
        res.status(200).json({message: `User ${id} deleted successfully`});
    } else {
        console.log("DAL deleteUser unsuccessfull");
    }
});


app.listen(PORT, () => {
    console.log("Server listening at http://localhost:"+PORT);
});





