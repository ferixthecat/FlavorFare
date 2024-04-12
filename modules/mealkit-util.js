let mealkits = [
    {
        "title": "Mediterranean Delight",
        "includes": "Quinoa, Hummus & Mixed Green Salad with lemon-olive oil dressing",
        "description": "Herb grilled chicken, quinoa, hummus, mixed greens salad with lemon-olive oil dressing",
        "category": "Shareable Dinners",
        "price": 23.99,
        "cookingTime": 30,
        "servings": 2,
        "imageUrl": "/images/mealimgs/medchicken.jpg",
        "featuredMealKit": true 
    },
    {
        "title": "Italian Pasta Night",
        "includes": "Garlic Bread & Caesar Salad",
        "description": "Spaghetti, marinara sauce, garlic bread, Caesar salad",
        "category": "Shareable Dinners",
        "price": 21.99,
        "cookingTime": 20,
        "servings": 2,
        "imageUrl": "/images/mealimgs/pasta.jpg",
        "featuredMealKit": true 
    },
    {
        "title": "Thai",
        "includes": "Jasmine Rice & Spring Rolls with Peanut Dipping Sauce",
        "description": "Thai coconut curry, chicken/tofu, jasmine rice, spring rolls with peanut dipping sauce",
        "category": "Shareable Dinners",
        "price": 25.99,
        "cookingTime": 60,
        "servings": 2,
        "imageUrl": "/images/mealimgs/curry.jpg",
        "featuredMealKit": true 
    },
    {
        "title": "Chinese",
        "includes": "Quinoa, Hummus & Mixed Green Salad with lemon-olive oil dressing",
        "description": "Herb grilled chicken, quinoa, hummus, mixed greens salad with lemon-olive oil dressing",
        "category": "Shareable Dinners",
        "price": 23.99,
        "cookingTime": 30,
        "servings": 2,
        "imageUrl": "/images/mealimgs/sschicken.jpg",
        "featuredMealKit": true 
    },
    {
        "title": "Eggs Benny",
        "includes": "Avocado, Salad with Vinaigrette, English Muffin",
        "description": "Eggs Benny with Avocado, Salad with Vinaigrette",
        "category": "Breakfast",
        "price": 14.99,
        "cookingTime": 15,
        "servings": 2,
        "imageUrl": "/images/mealimgs/benny.jpg",
        "featuredMealKit": false 
    },
    {
        "title": "Breakfast Burritos",
        "includes": "eggs, sausage, bacon, green onion, chives, hot sauce",
        "description": "Breakfast burritos with eggs, sausage, bacon, green onions, chives, hot sauce, Ketchup",
        "category": "Breakfast",
        "price": 13.99,
        "cookingTime": 15,
        "servings": 1,
        "imageUrl": "/images/mealimgs/burrito.jpg",
        "featuredMealKit": false 
    }
];

function getAllMealKits() {
    return mealkits;
}

function getFeaturedMealKits(mealkits) {
    let filtered = [];

    for (let i = 0; i < mealkits.length; i++) {
        if (mealkits[i].featuredMealKit) {
            filtered.push(mealkits[i]);
        }
    }

    return filtered;
}

function getMealKitsByCategory(mealkits) {
    let categories = {};

    mealkits.forEach(kit =>  {
        if (!categories[kit.category]) {
            categories[kit.category] = [kit];
        } else {
            categories[kit.category].push(kit);
        }
    });

    const categorizedMealKits = Object.keys(categories).map(categoryName => {
        return {
            categoryName,
            mealKits: categories[categoryName]
        };
    });

    return categorizedMealKits;
}

module.exports = { getAllMealKits, getFeaturedMealKits, getMealKitsByCategory };