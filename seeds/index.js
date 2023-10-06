const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require('./cities');
const { descriptors, places } = require("./seedHelpers");

mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp-2", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

function sample(array) {
    return array[Math.floor(Math.random() * array.length)]
}

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: "This beautiful campground is nestled in a lush, forested valley with spacious and well-maintained campsites surrounded by towering trees and fragrant wildflowers. Guests can enjoy modern amenities like clean restroom facilities, grills, and a playground. There are plenty of hiking and biking trails to explore and a communal fire pit to gather around at night. It's a peaceful and welcoming retreat in the heart of nature.",
            images: [
                {
                    url: 'https://res.cloudinary.com/dx4cc4jvr/image/upload/v1696441950/YelpCamp/tpzkts0mqsekvmxoxfqn.jpg',
                    filename: 'YelpCamp/tpzkts0mqsekvmxoxfqn'
                },
                {
                    url: 'https://res.cloudinary.com/dx4cc4jvr/image/upload/v1696441949/YelpCamp/maas6dyimxo6djib7fvy.jpg',
                    filename: 'YelpCamp/maas6dyimxo6djib7fvy'
                }
            ],
            author: '651c5f049026c057827ddc6c',
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            price
        })
        await camp.save()
    }
}

seedDB().then(() => {
    db.close();
})