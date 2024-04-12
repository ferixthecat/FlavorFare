const express = require("express");
const mealkitModel = require("../models/mealkitModel");
const { getAllMealKits } = require("../modules/mealkit-util");
const router = express.Router();

router.get("/mealkits", (req, res) => {
    // Protect route, so only data clerks able to access it
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
        // Clerk is signed in
        // Load data here
        mealkitModel.countDocuments()
            .then(count => {
                if (count === 0) {
                    const mealKits = getAllMealKits();
                    mealkitModel.insertMany(mealKits)
                        .then(() => {
                            res.render("users/load", {title: "Loaded", message: "Added meal kits to the database"});
                        })
                        .catch(err => {
                            res.send("Couldn't insert the documents: " + err);
                        });
                }
                else {
                    res.render("users/load", { title: "Preloaded", message: "Meal kits have already been added to the database"});
                }
            });
    }
    else {
        // Clerk is not signed in, cannot load data, present error
        res.status(403).render("general/error", { title: "403", message: "You are not authorized to add meal kits" });
    }
})

module.exports = router;