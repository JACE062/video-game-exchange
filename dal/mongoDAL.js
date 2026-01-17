const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dev:Pa$sword@cluster0.h848i6m.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dal = {
    getAllUsers : async function() {
        console.log("Get all Users");
        let users = [];
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Users");
            users = await coll.find().toArray();
        } finally {
            client.close();
        }
        console.log("Get all Users results: ", users);
        return users;
    },
    getUserById : async function(id) {
        console.log("Get User by id: ", id);

        let user;
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Users");
            user = await coll.findOne({id : id});
        } finally {
            client.close();
        }

        console.log("Get User by id results: ", user);
        return user;

    },
    createUser : async function(newUser) {
        console.log("Create User");
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Users");
            let allUsers = await coll.find().toArray();
            let lastUser = allUsers[allUsers.length-1];
            if(lastUser) {
                newUser.id = lastUser.id + 1;
            } else {
                newUser.id = 1;
            }

            await coll.insertOne(newUser);
            console.log("Added User successfully to database: ", newUser);
            return newUser;
        } finally {
            client.close();
        } 

    }, 
    updateUser : async function(id, updateFields) {
        console.log("Update User with id: ", id);
        console.log("Update User fields: ", updateFields);
        let updateDoc = {
            $set : updateFields
        };

        const c = new MongoClient(uri);
        try {
            await c.connect();
            let db = c.db("VideoGameExchange");
            let coll = db.collection("Users");
            let result = await coll.updateOne({id : id}, updateDoc, {upsert: false});
            console.log("User updated successfully to database");
            return result;
        } finally {
            client.close();
        }
    }, 
    deleteUser : async function(id) {
        console.log("Delete User by id: ", id);

        const c = new MongoClient(uri);
        try {
            await c.connect();
            let db = c.db("VideoGameExchange");
            let coll = db.collection("Users");
            await coll.deleteOne({id : id});
            console.log("User deleted successfully from database");
            return true;
        } catch {
            return false;
        } finally {
            c.close();
        }
    }, 
    // Query implementation done partially by Gemini
    getAllGames : async function(query) {
        console.log("Get all Games");
        // if (Object.keys(query).length != 0) {
            console.log("Search query: ", query);
        // }
        let games = [];
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Games");
            games = await coll.find(query).toArray();
        } finally {
            client.close();
        }
        console.log("Get all Games results: ", games);
        return games;
    }, 
    // End of AI assistance
    getGameById : async function(id) {
        console.log("Get Game by id: ", id);
        let game;
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Games");
            game = await coll.findOne({id : id});
            console.log("Get game by id successfull: ", game);
        } finally {
            client.close();
        }
        console.log("Get Games by id results: ", game);
        return game;
    }, 
    getGamesByUserId : async function(userId) {
        console.log("Get Games by userId: ", userId);
        let games = [];
        
        const c = new MongoClient(uri);
        try {
            await c.connect();
            let db = c.db("VideoGameExchange");
            let coll = db.collection("Games");
            games = await coll.find({ownerId : userId}).toArray();
        } finally {
            c.close();
        }
        console.log("Get Games by userId results: ", games);
        return games;
    }, 
    createGame : async function(newGame) {
        console.log("Create Game");
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Games");
            let allGames = await coll.find().toArray();
            let lastGame = allGames[allGames.length-1];
            if(lastGame) {
                newGame.id = lastGame.id + 1;
            } else {
                newGame.id = 1;
            }

            await coll.insertOne(newGame);
            console.log("Added Game successfully to database: ", newGame);
            return newGame;
        } finally {
            client.close();
        }
    }, 
    updateGame : async function(id, updateFields) {
        console.log("Update Game with id: ", id);
        console.log("Update Game fields: ", updateFields);
        let updateDoc = {
            $set : updateFields
        };

        const c = new MongoClient(uri);
        try {
            await c.connect();
            let db = c.db("VideoGameExchange");
            let coll = db.collection("Games");
            let result = await coll.updateOne({id : id}, updateDoc, {upsert: false});
            console.log("Game updated successfully in database");
            return result;
        } finally {
            client.close();
        }
    }, 
    deleteGame : async function(id) {
        console.log("Delete Game by id: ", id);

        const c = new MongoClient(uri);
        try {
            await c.connect();
            let db = c.db("VideoGameExchange");
            let coll = db.collection("Games");
            await coll.deleteOne({id : id});
            console.log("Game deleted successfully from database");
            return true;
        } catch {
            return false;
        } finally {
            c.close();
        }
    }, 
}

exports.dal = dal;










