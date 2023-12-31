const mongoose = require("mongoose");
const review = require("./review");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200'); //url to get 200px picture for thumbnail
})

const opts = {toJSON: {virtuals:true}} //make virtual appear when sending data in json format

const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    location: String,
    //geojson standard
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    images: [ImageSchema],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
},opts);


CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    //popup in the map, make XSS vunerability, fixed by HTML sanitize
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong><p>${this.location}</p>`
})

CampgroundSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await review.deleteMany({
            _id: {
                $in: doc.reviews,
            },
        });
    }
});

module.exports = mongoose.model("Campground", CampgroundSchema);
