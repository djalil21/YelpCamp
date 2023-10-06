const Campground = require("../models/campground")
const mapBoxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapboxToken = process.env.MAPBOX_TOKEN
const geocoder = mapBoxGeocoding({ accessToken: mapboxToken })
const { cloudinary } = require('../utils/cloudinary')

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render("campgrounds/index", { campgrounds });
}


module.exports.renderNewForm = (req, res) => {

    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body?.campground);
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    campground.geometry = geoData.body.features[0].geometry
    await campground.save();
    req.flash('success', 'succesfully made a new campground');
    res.redirect('/campgrounds')
}

module.exports.showCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
        .populate({
            path: 'reviews',
            populate: {
                path: 'author'
            }
        }).populate('author')
    if (!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    res.render('campgrounds/edit', { campground })
}
module.exports.editCampground = async (req, res) => {
    const { id } = req.params;
    const newCampground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
    const images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    newCampground.images.push(...images);
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    newCampground.geometry = geoData.body.features[0].geometry
    await newCampground.save()
    if (req.body.deletedImages) {
        for (const filename of req.body.deletedImages) {
            await cloudinary.uploader.destroy(filename)
        }
        await newCampground.updateOne({ $pull: { images: { filename: { $in: req.body.deletedImages } } } })
    }
    req.flash('success', 'updated campground')
    res.redirect(`/campgrounds/${newCampground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    req.flash('success', 'deleted campground')
    res.redirect(`/campgrounds`)
}