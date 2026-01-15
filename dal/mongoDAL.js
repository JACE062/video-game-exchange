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
            console.log("Added User successfully to database: ", newUser)
            return newUser.id;
        } finally {
            client.close();
        }
    }, 
    updateUser : async function(id, updatedUser) {
        console.log("Update User with id: ", id);
        console.log("Update user user: ", updatedUser);
        let updateDoc = {};
        let name = updatedUser.name;
        let address = updatedUser.address;

        if (name && address) {
            updateDoc.$set = {
                name : name,
                address : address
            }
        } else if (name) {
            updateDoc.$set = {
                name : name
            }
        } else {
            updateDoc.$set = {
                address : address
            }
        }
        console.log("UpdateDoc:", updateDoc);
        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Users");
            await coll.updateOne({id : id}, updateDoc, {upsert: false});
            console.log("User updated successfully to database")
            return true;
        } finally {
            client.close();
        }
    }, 
    deleteUser : async function(id) {
        console.log("Delete Class by id: ", id);

        try {
            await client.connect();
            let db = client.db("VideoGameExchange");
            let coll = db.collection("Users");
            await coll.deleteOne({id : id});
            console.log("User deleted successfully from database");
            return true;
        } catch {
            return false;
        } finally {
            client.close();
        }
    }, 
    getAllGames : async function() {

    }, 
    getGameById : async function(id) {

    }, 
    getGamesByName : async function(name) {

    }, 
    getGamesByPublisher : async function(publisher) {

    }, 
    getGamesBySystem : async function(system) {

    }, 
    getGamesByUser : async function(userId) {

    }, 
    createGame : async function(newGame) {

    }, 
    updateGame : async function(id, updatedGame) {

    }, 
    deleteGame : async function(id) {

    }, 
}

exports.dal = dal;










