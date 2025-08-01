const allowedRequestsPerDay = 50

const express = require("express")
const { rateLimit } = require("express-rate-limit")
const {AddressValidationClient} = require('@googlemaps/addressvalidation').v1
const axios = require("axios")
const dotenv = require('dotenv').config({quiet: true})
const { addressToCoordinates, returnFromCoordinates } = require("./api.mjs")
const { google } = require("@googlemaps/addressvalidation/build/protos/protos")

const app = express()
const addressvalidationClient = new AddressValidationClient()
const rateLimitSpecs = rateLimit({
	windowMs: 24 * 60 * 60 * 1000, // 24 hours
	limit: allowedRequestsPerDay, // Amount of requests per windowMs
    message: `You may only make ${allowedRequestsPerDay} requests every 24 hours. `,
    handler: (req, res) => {
        res.status(429).sendFile(__dirname + "/public/rateLimit.html")
    },
	standardHeaders: 'draft-8',
	legacyHeaders: true, 
	ipv6Subnet: 56
})
const googleApiKey = process.env.googleApiKey

if (!googleApiKey) {
    console.error("Google API key is not set. Please set the .env file according to the .env.example file.")
    process.exit(1)
}

app.use(express.static(__dirname + "/public"))
app.use(rateLimitSpecs)

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

app.get("/generate", async (req, res) => {
    res.sendFile(__dirname + "/public/generate.html")
})

app.get("/api/submitAddress", async (req, res) => {
    addressToCoordinates(req, res, addressvalidationClient, axios)
})

app.get("/api/getImageFromCoordinates", async (req, res) => {
    returnFromCoordinates(req, res, googleApiKey, axios)
})

app.listen(80, () => {
    console.log("Server started on http://localhost:80")
})