const express = require("express");
const sgMail = require('@sendgrid/mail');
const router = express.Router();
const bcryptjs = require("bcryptjs");
const userModel = require("../models/userModel");
const MealKit = require("../models/mealkitModel");

const { ensureAuthenticatedAndRole } = require("../utils/middleware");
const mealkitModel = require("../models/mealkitModel");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/", (req, res) => {
    MealKit.find({ featuredMealKit: true })
        .then(featuredMealKits => {
            res.render("general/home", {title: "Home", featuredMealKits: featuredMealKits});
        })
        .catch(err => {
            console.error("Error fetching featured meal kits:", err);
        });
});

router.get("/sign-up", (req, res) => {
    res.render("users/sign-up", {title: "Sign-Up", errors: {}, formData: {}});
});

router.post("/sign-up", (req, res) => {
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

    userModel.findOne({ email: email })
        .then(user => {
            if (user) {
                errors.email = 'This email is already in use. Please use a different email.';
            }

            if (Object.keys(errors).length > 0) {
                res.render("users/sign-up", {title: "Sign-Up", errors, formData: { firstName, lastName, email, password } });
            } else {
                const newUser = new userModel({ firstName, lastName, email, password });
    
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
                
                newUser.save()
                    .then(userSaved => {
                        console.log(`User ${userSaved.firstName} has been added to database.`)
                        res.redirect("/welcome");
                    })
                    .catch(err => {
                        console.log(`Error adding user to the database ... ${err}`);
                        res.render("users/sign-up", {title: "Sign-Up", errors, formData: { firstName, lastName, email, password } });
                    });
                }
        }).catch(err => {
            res.render("users/sign-up", {title: "Sign-Up", errors, formData: { firstName, lastName, email, password } });
        });
});

router.get("/log-in", (req, res) => {
    res.render("users/log-in", {title: "Log-In", errors: [], formData: {} });
});

router.post("/log-in", (req, res) => {
    const { email, password, role } = req.body;
    let errors = [];

    if (!email || email.trim() === '') {
        errors.push({ field: 'email', message: 'Please enter your email address'});
    }

    if (!password || password.trim() === '') {
        errors.push({ field: 'password', message: 'Please enter your password'});
    }

    if (errors.length > 0) {
        return res.render("users/log-in", { title: "Log-In", errors, formData: { email, password } });
    }

    userModel.findOne({
        email 
    })
        .then(user => {
            if (user) {
                bcryptjs.compare(password, user.password)
                    .then(matched => {
                        if (matched) {
                            req.session.user = { 
                                firstName: user.firstName,
                                email: user.email,
                                role: role 
                            };
                            
                            if (role === 'dataentryclerk') {
                                return res.redirect("/mealkits/list");
                            }
                            else {
                                return res.redirect("/cart");
                            }
                        }
                        else {
                            errors.push({ message: "The email and/or password you entered is incorrect. Please try again." });
                            return res.render("users/log-in", { title: "Log-In", errors, formData: { email, password } });
                        }
                    })
            }
            else {
                errors.push({ message: "The email and/or password you entered is incorrect. Please try again." });
                return res.render("users/log-in", { title: "Log-In", errors, formData: { email, password } });
            }
        })
        .catch(err => {
            errors.push({ message: "Unable to query the database: " + err });
            return res.render("users/log-in", { title: "Log-In", errors, formData: { email, password } });
        })
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/log-in");
});

router.get("/welcome", (req, res) => {
    res.render("general/welcome", {title: "Welcome"});
});

router.get("/cart", ensureAuthenticatedAndRole('customer'), (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Calculate totals and other necessary cart data
    let cartItems = req.session.cart;
    let subtotal = req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    let tax = subtotal * 0.10; 
    let grandTotal = subtotal + tax;

    const message = req.session.message;
    delete req.session.message;

    res.render("users/cart", {
        title: "Shopping Cart",
        cartItems: cartItems,  // The array of cart items
        subtotal: subtotal.toFixed(2),  // Formatted subtotal
        tax: tax.toFixed(2),  // Formatted tax
        grandTotal: grandTotal.toFixed(2),  // Formatted grand total
        message: message
    });
});

router.post("/add-to-cart/:id", (req, res) => {
   const mealkitId = req.params.id;
   if (!req.session.cart) {
       req.session.cart = [];
   }

   mealkitModel.findById(mealkitId)
       .then(mealkit => {
            const cartItem = req.session.cart.find(item => item.id === mealkitId);
            if (cartItem) {
                cartItem.quantity += 1;
            }
            else {
                req.session.cart.push({
                    id: mealkit._id,
                    title: mealkit.title,
                    includes: mealkit.includes,
                    imageUrl: mealkit.imageUrl,
                    price: mealkit.price,
                    quantity: 1
                });
            }
            req.session.message = 'Meal kit successfully added';
            res.redirect('/cart');
       })
       .catch(err => {
            console.error('Error adding to cart:', err);
       });
});

router.post('/update-cart/:id', (req, res) => {
    const itemId = req.params.id;
    const newQuantity = parseInt(req.body.quantity);

    let cartItem = req.session.cart.find(item => item.id === itemId);
    if (cartItem) {
        cartItem.quantity = newQuantity;
    }

    req.session.message = 'Meal kit quantity successfully updated';
    res.redirect('/cart');
});

router.post("/remove-from-cart/:id", (req, res) => {
    req.session.cart = req.session.cart.filter(item => item.id !== req.params.id);
    req.session.message = 'Meal kit successfully removed.';
    res.redirect('/cart');
});

router.post("/check-out", (req, res) => {
    if (req.session.user && req.session.user.role === 'customer') {
        let cart = req.session.cart || [];
        if (cart.length > 0) {
            const cartItems = req.session.cart;
            const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            const tax = subtotal * 0.10;
            const grandTotal = subtotal + tax;

            const emailContent = `
                <h1>Order Details</h1>
                ${cartItems.map(item => `
                    <p>${item.title} - Price: $${item.price.toFixed(2)} - Quantity: ${item.quantity} - Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
                `).join('')}
                <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
                <p><strong>Tax:</strong> $${tax.toFixed(2)}</p>
                <p><strong>Total:</strong> $${grandTotal.toFixed(2)}</p>
            `;

            const msg = {
                to: req.session.user.email,
                from: 'flavorfaredirect@hotmail.com',
                subject: 'Your FlavorFare Order',
                html: emailContent,
            };

            sgMail
                    .send(msg)
                    .then(() => {
                        req.session.cart = [];
                        req.session.message = 'Ordered placed successfully';
                        res.redirect('/cart');
                    })
                    .catch((error) => {
                        console.error('Error sending email: ', error);
                        res.status(500).send('Error sending email.')
                    });
        }
    }
});

module.exports = router;