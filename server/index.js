require("dotenv").config()

const connectToMongo = require("./db")
const express = require("express")
const cors = require("cors")

connectToMongo()

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

app.use("/api/auth", require("./routes/auth"))
app.use("/api/records", require("./routes/records"))
app.use("/api/groups", require("./routes/groups"))
app.use("/api/notifications", require("./routes/notifications"))

// Catch-all error handler for anything that slips past route-level try/catch
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ success: false, error: "Something went wrong on the server" })
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
