const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { getMealKitsByCategory } = require('../modules/mealkit-util');
const { ensureAuthenticatedAndRole } = require("../utils/middleware");
const mealkitModel = require("../models/mealkitModel");
const MealKit = require("../models/mealkitModel");

router.get("/", (req, res) => {
    MealKit.find({})
        .then(allMealKits => {
            const categories = getMealKitsByCategory(allMealKits);
            res.render("general/mealkits", {title: "Meal Kits", categories: categories });
        })
        .catch(err => {
            console.error("Error fetching meal kits:", err);
        })
    
});

router.get("/list", (req, res) => {
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
        MealKit.find({}).sort('title')
            .then(mealKits => {
                res.render("users/mealkitlist", {title: "Meal Kits List", mealKits: mealKits});
            })
            .catch(err => {
                res.status(500).render("general/error", {title: "Error", message: "Error occurred while fetching meal kits."});
            });
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.get("/add", (req, res) => {
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
        res.render("users/add", {title: "Add", errors: [], formData: {}});
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.post("/add", (req, res) => {
    const { title, includes, description, category, price, cookingTime, servings } = req.body;
    const featuredMealKit = req.body.featuredMealKit ? true : false;

    if (req.session.user && req.session.user.role === 'dataentryclerk') {

        if (!title || !includes || !description || !category || !price || !cookingTime || !servings || !req.files || !req.files.imageUrl) {
            return res.render("users/add", {
                title: "Add",
                errors: [{ message: "Please fill in all fields and upload an image."}],
                formData: req.body
            });
        }

        const mealPicFile = req.files.imageUrl;
        const newFileName = `${Date.now()}-${mealPicFile.name}`;
        const uploadPath = path.join(__dirname, '../assets/images/mealimgs', newFileName);

        mealPicFile.mv(uploadPath, function(err) {
            if (err) return res.status(500).send(err);

            const newMealKit = new mealkitModel({
                title,
                includes,
                description,
                category,
                price,
                cookingTime,
                servings,
                imageUrl: `/images/mealimgs/${newFileName}`,
                featuredMealKit
            });
        
            newMealKit.save()
                .then(() => {
                    console.log("Added mealkit");
                    res.redirect("/mealkits/list")
                })
                .catch(err => {
                    console.log("Couldn't add meal kit: " + err);
                    res.redirect("/mealkits/add");
                });
        })
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.get("/edit/:id", (req, res) => {
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
        mealkitModel.findById(req.params.id)
            .then(mealKit => {
                res.render("users/edit", {
                    title: "Edit Meal Kit",
                    formData: mealKit 
                });
            })
            .catch(err => {
                console.error(err);
            });
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.post("/edit/:id", (req, res) => {
    const { title, includes, description, category } = req.body;
    const price = parseFloat(req.body.price);
    const cookingTime = parseInt(req.body.cookingTime);
    const servings = parseInt(req.body.servings);
    const featuredMealKit = req.body.featuredMealKit ? true : false;

    if (req.session.user && req.session.user.role === 'dataentryclerk') {
        let updatedData = {
            title,
            includes,
            description,
            category,
            price,
            cookingTime,
            servings,
            featuredMealKit
        };

        mealkitModel.findById(req.params.id)
            .then(mealKit => {
                if (!mealKit) {
                    return res.status(404).send('Meal kit not found');
                }

                if (req.files && req.files.imageUrl) {
                    const mealPicFile = req.files.imageUrl;
                    const newFileName = `${Date.now()}-${mealPicFile.name}`;
                    const newFilePath = path.join(__dirname, '../assets/images/mealimgs', newFileName);
        
                    // Delete old file asynchronously if it exists
                    if (mealKit.imageUrl) {
                        const oldFilePath = path.join(__dirname, mealKit.imageUrl);
                        fs.unlink(oldFildPath, err => {
                            if (err) console.log(`Old file not deleted: ${err}`);
                        });
                    }

                    mealPicFile.mv(newFilePath, err => {
                        if (err) {
                            console.error('Failed to upload new image:', err);
                            return res.status(500).send('Failed to upload new image.');
                        }

                        updatedData.imageUrl = `images/mealimgs/${newFileName}`;

                        mealkitModel.findByIdAndUpdate(req.params.id, updatedData)
                            .then(() => res.redirect("/mealkits/list"))
                            .catch(err => {
                                console.error('Error updating meal kit:', err);
                                res.status(500).send('Server Error');
                            });
                    });
                } else {
                    mealkitModel.findByIdAndUpdate(req.params.id, updatedData)
                        .then(() => res.redirect("/mealkits/list"))
                        .catch(err => {
                            console.error('Error updating meal kit:', err);
                            res.status(500).send('Server Error');
                        });
                }
            })
            .catch(err => {
                console.error('Failed to find meal kit:', err);
                res.status(500).send('Server Error');
            });
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.get("/remove/:id", (req, res) => {
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
    mealkitModel.findById(req.params.id)
       .then(mealKit => {
            res.render("users/remove", {
                title: "Confirm Removal",
                mealKit: mealKit 
            });
       })
       .catch(err => {
            console.error(err);
       });
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

router.post("/remove/:id", (req, res) => {
    if (req.session.user && req.session.user.role === 'dataentryclerk') {
    mealkitModel.findById(req.params.id)
        .then(mealKit => {
            const filePath = path.join(__dirname, '../assets', mealKit.imageUrl)
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete image file:', err);
                    return res.status(500).send('Failed to delete image file.');
                }
                
                mealkitModel.findByIdAndDelete(mealKit._id)
                    .then(() => {
                        res.redirect('/mealkits/list');
                    })
                    .catch(err => {
                        console.error('Failed to delete meal kit:', err);
                        return res.status(500).render("general/error", {title: "Error", message: "Failed to delete meal kit"});
                    });
            });
        })
        .catch(err => {
            console.error('Failed to find meal kit:', err);
        });
    }
    else {
        res.status(401).render("general/error", { title: "401", message: "Admin access only" });
    }
});

module.exports = router;