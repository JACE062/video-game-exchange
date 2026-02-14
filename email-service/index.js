const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");

const kafka = new Kafka({
    clientId: "email-service",
    brokers: ["broker:29092"],
    retry: {
        initialRetryTime: 3000,
        retries: 10
    }
});

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'johnathon.pfeffer59@ethereal.email',
        pass: 'X8qz77aRNBJ1bu7fKS'
    }
});

function objectFromStringValue(messageValueString) {
    try {
        const parsedJson = JSON.parse(messageValueString); 
        return parsedJson;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return {};
    }
}

async function handleUsersEmails(key, value) {
    let data = objectFromStringValue(value);
    let user = data.user;
    if (key === "password-updated") {
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: user.email,
            subject: "VGE Password Changed",
            text: "Hello, " + user.name + " (User Id: " + user.id + "),\n\nYour password has been changed, contact support if you did not initiate this change.",
            html: "<p>Hello, " + user.name + " (User Id: " + user.id + "),</p><b>Your password has been changed</b>, contact support if you did not initiate this change. ",
        });    
    } else {
        console.log("Invalid message key provided, no notifications sent :(");
    }
}

async function handleTradesEmails(key, value) {
    let data = objectFromStringValue(value);

    let tradeId = data.tradeId;
    let sender = data.sender;
    let senderGame = data.senderGame;
    let receiver = data.receiver;
    let receiverGame = data.receiverGame;
    if (key === "trade-created") {
        
        
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: sender.name + " <" + sender.email + ">",
            subject: "VGE Trade Offer Sent",
            text: "Hello, " + sender.name + " (User Id: " + sender.id + "),\n\nYou successfully created a Trade offer (Trade Id: " + tradeId + ") sent to " + receiver.name + " (User Id: " + receiver.id + ")."+ 
            "\n\nYou offered: " + senderGame.name + " (Game Id: " + senderGame.id + ") for their: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nYou may delete the Trade if this information is incorrect or the Trade offer was made mistakenly."
        });  
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: receiver.name + " <" + receiver.email + ">",
            subject: "VGE Trade Offer Recieved",
            text: "Hello, " + receiver.name + " (User Id: " + receiver.id + "),\n\nYou have just received a Trade offer (Trade Id: " + tradeId + ") sent by " + sender.name + " (User Id: " + sender.id + ")."+ 
            "\n\nThey offered their: " + senderGame.name + " (Game Id: " + senderGame.id + ") for your: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nYou may view and accept/reject the trade through the Video Game Exchange API"
        });  
    } else if (key === "trade-accepted") {
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: sender.name + " <" + sender.email + ">",
            subject: "VGE Trade Offer Accepted",
            text: "Hello, " + sender.name + " (User Id: " + sender.id + "),\n\nYour Trade offer (Trade Id: " + tradeId + ") sent to " + receiver.name + " (User Id: " + receiver.id + ") was Accepted!"+ 
            "\n\nYou have successfully traded your: " + senderGame.name + " (Game Id: " + senderGame.id + ") for their: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nThank you for using the Video Game exchange, we hope that you enjoy your new game!"
        });  
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: receiver.name + " <" + receiver.email + ">",
            subject: "VGE Trade Offer Accepted",
            text: "Hello, " + receiver.name + " (User Id: " + receiver.id + "),\n\nYou accepted a Trade offer (Trade Id: " + tradeId + ") sent by " + sender.name + " (User Id: " + sender.id + ")."+ 
            "\n\nYou have successfully accepted their offered: " + senderGame.name + " (Game Id: " + senderGame.id + ") in exchange for your: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nThank you for using the Video Game exchange, we hope that you enjoy your new game!"
        }); 
    } else if (key === "trade-rejected") {
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: sender.name + " <" + sender.email + ">",
            subject: "VGE Trade Offer Rejected",
            text: "Hello, " + sender.name + " (User Id: " + sender.id + "),\n\nYour Trade offer (Trade Id: " + tradeId + ") sent to " + receiver.name + " (User Id: " + receiver.id + ") was Rejected."+ 
            "\n\nThey have denied your offer of: " + senderGame.name + " (Game Id: " + senderGame.id + ") for their: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nThank you for using the Video Game exchange, we wish you luck in trades in the future!"
        });  
        await transporter.sendMail({
            from: 'The Video Game Exchange <johnathon.pfeffer59@ethereal.email>',
            to: receiver.name + " <" + receiver.email + ">",
            subject: "VGE Trade Offer Rejected",
            text: "Hello, " + receiver.name + " (User Id: " + receiver.id + "),\n\nYou successfully rejected a Trade offer (Trade Id: " + tradeId + ") sent by " + sender.name + " (User Id: " + sender.id + ")."+ 
            "\n\nYou have denied their offer of: " + senderGame.name + " (Game Id: " + senderGame.id + ") in exchange for your: " + receiverGame.name  + " (Game Id: " + receiverGame.id + ")." +
            "\n\nThank you for using the Video Game exchange, we wish you luck in trades in the future!"
        }); 
    } else {
        console.log("Invalid message key provided, no notifications sent :(");
    }
}


async function run() {
    const consumer = kafka.consumer({ groupId: "notification-group"});

    const startConsumer = async () => {
        try {
            console.log("Connecting to Kafka broker...");
            await consumer.connect();

            console.log("Subscribing to topics...");
            await consumer.subscribe({topics: ["Users", "Trades"]});

            console.log("Consumer running...");
            await consumer.run({
                eachMessage: async ({ topic, partition, message}) => {
                    let key = message.key.toString()
                    let value = message.value.toString()
                    console.log({
                        topic: topic,
                        key: key,
                        value: value,
                        headers: message.headers,
                    })
                    if (topic === "Users") {
                        console.log("Users topic message: ", message);
                        await handleUsersEmails(key, value);
                    }
                    if (topic === "Trades") {
                        console.log("Trades topic message: ", message);
                        await handleTradesEmails(key, value);
                    }
                },
            })

        } catch (error) {
            console.error("Consumer error during startup:", error.message);
            console.log("Retrying in 5 seconds...");
            setTimeout(startConsumer, 5000); 
        }
    }

    startConsumer();
}

run().catch(console.error);