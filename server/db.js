const mongoose = require("mongoose")

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/udhaar"

const connectToMongo = () => {
    mongoose.connect(mongoURI)
        .then(() => console.log("Connected to MongoDB"))
        .catch((error) => {
            console.error("MongoDB connection error:", error.message)
            process.exit(1)
        })
}

module.exports = connectToMongo
