const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const user = process.env.MONGO_USER
const password = process.env.MONGO_PASSWORD
const uri = `mongodb+srv://${user}:${password}@cluster0.h848i6m.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Improved DB connection handling with Gemini
let db;

let connectToDb = async function () {
    await client.connect();
    db = client.db("VideoGameExchange");
    console.log("Connected to MongoDB");
}

let closeDb = async function () {
    await client.close();
    console.log("MongoDB connection closed.");
}
// End of Gemini-assisted code

let dal = {
    getAllUsers: async function () {
        console.log("Get all Users");
        let users = [];
        let coll = db.collection("Users");
        users = await coll.find().toArray();
        console.log("Get all Users results: ", users);
        return users;
    },
    getUserById: async function (id) {
        console.log("Get User by id: ", id);

        let user;
        let coll = db.collection("Users");
        user = await coll.findOne({ id: id });

        console.log("Get User by id results: ", user);
        return user;
    },
    createUser: async function (newUser) {
        console.log("Create User");

        let coll = db.collection("Users");
        let allUsers = await coll.find().toArray();
        let lastUser = allUsers[allUsers.length - 1];
        if (lastUser) {
            newUser.id = lastUser.id + 1;
        } else {
            newUser.id = 1;
        }

        await coll.insertOne(newUser);
        console.log("Added User successfully to database: ", newUser);
        return newUser;
    },
    updateUser: async function (id, updateFields) {
        console.log("Update User with id: ", id);
        console.log("Update User fields: ", updateFields);
        let updateDoc = {
            $set: updateFields
        };

        let coll = db.collection("Users");
        let result = await coll.updateOne({ id: id }, updateDoc, { upsert: false });
        console.log("User updated successfully to database");
        return result;
    },
    deleteUser: async function (id) {
        console.log("Delete User by id: ", id);

        try {
            let coll = db.collection("Users");
            await coll.deleteOne({ id: id });
            console.log("User deleted successfully from database");
            return true;
        } catch {
            return false;
        }
    },
    // Query implementation done partially by Gemini
    getAllGames: async function (query) {
        console.log("Get all Games");
        console.log("Search query: ", query);
        let games = [];

        let coll = db.collection("Games");
        games = await coll.find(query).toArray();

        console.log("Get all Games results: ", games);
        return games;
    },
    // End of AI assistance
    getGameById: async function (id) {
        console.log("Get Game by id: ", id);
        let game;

        let coll = db.collection("Games");
        game = await coll.findOne({ id: id });
        console.log("Get game by id successfull: ", game);

        console.log("Get Games by id results: ", game);
        return game;
    },
    getGamesByUserId: async function (userId) {
        console.log("Get Games by userId: ", userId);
        let games = [];

        let coll = db.collection("Games");
        games = await coll.find({ ownerId: userId }).toArray();

        console.log("Get Games by userId results: ", games);
        return games;
    },
    createGame: async function (newGame) {
        console.log("Create Game");

        let coll = db.collection("Games");
        let allGames = await coll.find().toArray();
        let lastGame = allGames[allGames.length - 1];
        if (lastGame) {
            newGame.id = lastGame.id + 1;
        } else {
            newGame.id = 1;
        }

        await coll.insertOne(newGame);
        console.log("Added Game successfully to database: ", newGame);
        return newGame;
    },
    updateGame: async function (id, updateFields) {
        console.log("Update Game with id: ", id);
        console.log("Update Game fields: ", updateFields);
        let updateDoc = {
            $set: updateFields
        };

        let coll = db.collection("Games");
        let result = await coll.updateOne({ id: id }, updateDoc, { upsert: false });
        console.log("Game updated successfully in database");
        return result;
    },
    deleteGame: async function (id) {
        console.log("Delete Game by id: ", id);

        try {
            let coll = db.collection("Games");
            await coll.deleteOne({ id: id });
            console.log("Game deleted successfully from database");
            return true;
        } catch {
            return false;
        }
    },
    getTrades: async function (query, sort) {
        console.log("Get all Trades");
        console.log("Search query: ", query);
        console.log("Sort param: ", sort)

        let trades = [];
        let coll = db.collection("Trades");
        if (sort) {
            trades = await coll.find(query).sort({ sort }).toArray();
        } else {
            trades = await coll.find(query).toArray();
        }

        console.log("Get all Trades results: ", trades);
        return trades;
    },
    getTradeById: async function (id) {
        console.log("Get Trade by id: ", id);

        let trade;
        let coll = db.collection("Trades");
        trade = await coll.findOne({ id: id });

        console.log("Get Trade by id results: ", trade);
        return trade;
    },
    createTrade: async function (newTrade) {
        console.log("Create Trade");

        let coll = db.collection("Trades");
        let allTrades = await coll.find().toArray();
        let lastTrade = allTrades[allTrades.length - 1];
        if (lastTrade) {
            newTrade.id = lastTrade.id + 1;
        } else {
            newTrade.id = 1;
        }
        let date = new Date();

        newTrade.createdOn = (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes()
        newTrade.unixTimestamp = Date.now();

        await coll.insertOne(newTrade);
        console.log("Added Trade successfully to database: ", newTrade);
        return newTrade;
    },
    updateTrade: async function (id, updateField) {
        console.log("Update Trade with id: ", id);
        console.log("Update Trade field: ", updateField);
        let updateDoc = {
            $set: updateField
        };

        let coll = db.collection("Trades");
        let result = await coll.updateOne({ id: id }, updateDoc, { upsert: false });
        console.log("Trade updated successfully in database");
        return result;
    },
    deleteTrade: async function (id) {
        console.log("Delete Trade by id: ", id);
        try {
            let coll = db.collection("Trades");
            await coll.deleteOne({ id: id });
            console.log("Trade deleted successfully from database");
            return true;
        } catch {
            return false;
        }
    }
}

exports.connectToDb = connectToDb;
exports.closeDb = closeDb;
exports.dal = dal;










