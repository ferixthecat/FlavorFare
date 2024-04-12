/*************************************************************************************
* WEB322 - 2241 Project
* I declare that this assignment is my own work in accordance with the Seneca Academic
* Policy. No part of this assignment has been copied manually or electronically from
* any other source (including web sites) or distributed to other students.
*
* Student Name  : Felix Tse
* Student ID    : 107169229
* Course/Section: WEB322/NEE
*
**************************************************************************************/

const path = require("path");
const express = require("express");
const expressLayouts = require('express-ejs-layouts');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const fileUpload = require("express-fileupload");

// Environment configuration
dotenv.config({ path: "./config/keys.env" });

// Initialize Express app
const app = express();

// Static assets configuration
app.use(express.static(path.join(__dirname, "/assets")));

// EJS setup for templating
app.set("view engine", "ejs");
app.set("layout", "layouts/main");
app.use(expressLayouts);

// Body parser middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Set up express-fileupload
app.use(fileUpload());

app.set('views', path.join(__dirname, 'views'));

// Set up express-session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true 
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
})

// Set up controllers
const generalController = require("./controllers/generalCtrl");
const mealkitController = require("./controllers/mealkitsCtrl");
const loaddataController = require("./controllers/loaddataCtrl");

app.use("/", generalController);
app.use("/mealkits/", mealkitController);
app.use("/load-data/", loaddataController);

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
});


// *** DO NOT MODIFY THE LINES BELOW ***

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}
  
// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine
mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
        console.log("Connected to MongoDB database.");
        app.listen(HTTP_PORT, onHttpStart);
    })
    .catch(err => {
        console.log("Can't connect to the MongoDB: " + err);
    });