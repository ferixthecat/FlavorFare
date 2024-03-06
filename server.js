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
const bodyParser = require("body-parser");
const sgMail = require('@sendgrid/mail');

// Environment configuration
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Express app
const app = express();

// Static assets configuration
app.use(express.static(path.join(__dirname, "/assets")));

// Body parser middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));

// EJS setup for templating
app.set("view engine", "ejs");
app.set("layout", "layouts/main");
app.use(expressLayouts);

app.set('views', path.join(__dirname, 'views'));

const { getAllMealKits, getFeaturedMealKits, getMealKitsByCategory } = require('./modules/mealkit-util');

// Add your routes here
// e.g. app.get() { ... }
app.get("/", (req, res) => {
    const featuredMealKits = getFeaturedMealKits(getAllMealKits());
    res.render("layouts/home", {
        title: "Home",
        featuredMealKits: featuredMealKits 
    });
});

app.get("/on-the-menu", (req, res) => {
    const categories = getMealKitsByCategory(getAllMealKits());
    res.render("layouts/on-the-menu", {title: "On-the-menu", categories: categories });
});

app.get("/sign-up", (req, res) => {
    res.render("layouts/sign-up", {title: "Sign-Up", errors: {}, formData: {}});
});

app.post("/sign-up", (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let errors = {};

    if (!firstName || firstName.trim() === '') errors.firstName = 'Please enter your first name';
    if (!lastName || lastName.trim() === '') errors.lastName = 'Please enter your last name';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '') {
        errors.email = 'Please enter your email address';
    } else if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
    if (!password || password.trim() === '') {
        errors.password = 'Please enter a password';
    } else if (!passwordRegex.test(password)) {
        errors.password = 'Password must be 8-12 characters and include at least one lowercase letter, one number, and one symbol';
    }

    if (Object.keys(errors).length > 0) {
        res.render("layouts/sign-up", {title: "Sign-Up", errors, formData: { firstName, lastName, email, password } });
    } else {
        const msg = {
            to: email,
            from: 'flavorfaredirect@hotmail.com',
            subject: 'Welcome to FlavorFare Direct',
            text: `Hello ${firstName} ${lastName}, Welcome to FlavorFare Direct! We're thrilled to have you onboard as a member. - Felix Tse, FlavorFare Direct`,
            html: `<strong>Hello ${firstName} ${lastName},</strong><br>Welcome to FlavorFare Direct! We're thrilled to have you onboard as a member.<br>- Felix Tse, FlavorFare Direct`,
        }

        sgMail
            .send(msg)
            .then(() => {
                console.log('Welcome email sent');
            })
            .catch((error) => {
                console.error('Error sending welcome email: ', error);
            });
        res.redirect("/welcome");
    }
})

app.get("/log-in", (req, res) => {
    res.render("layouts/log-in", {title: "Log-In", errors: {}, formData: {} });
});

app.post("/log-in", (req, res) => {
    const { email, password } = req.body;
    let errors = {};

    if (!email || email.trim() === '') {
        errors.email = 'Please enter a valid email address';
    }

    if (!password || password.trim() === '') {
        errors.password = 'Please enter your password';
    }

    if (Object.keys(errors).length > 0) {
        res.render("layouts/log-in", { title: "Log-In", errors, formData: { email, password } });
    }
})

app.get("/welcome", (req, res) => {
    res.render("layouts/welcome", {title: "Welcome"});
});


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
app.listen(HTTP_PORT, onHttpStart);