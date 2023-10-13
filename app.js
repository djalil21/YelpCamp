//set automaticlly to production
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const {
  scriptSrcUrls,
  styleSrcUrls,
  connectSrcUrls,
  fontSrcUrls,
  imageSrcUrls,
} = require("./allowedContent");

const dbUrl = process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/yelp-camp-2";
const secret = process.env.secret || "yelpcamp@secret";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

app.engine("ejs", ejsMate); //ejsmate enable the working with boilerplate layout
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //setting default views directory

app.use(express.urlencoded({ extended: true })); //enable form url encoded
app.use(express.json()); //enable json requests
app.use(methodOverride("_method")); //make html form submit put and delete requestes
app.use(express.static(path.join(__dirname, "public"))); //serve static files
app.use(mongoSanitize()); //delete the $ symbole from requests, used in mongo injection attackes
app.use(flash()); //enable flash messages from server to frontend
app.use(helmet()); //set security headers

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", ...imageSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
); //set the allowed ressources that the browser can fetch from

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
}); //create mongo session store

store.on("error", (e) => {
  console.log("Session store error", e);
});

app.use(
  session({
    store,
    name: "camp",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
); //setting express session with mongo store

app.use(passport.initialize());
app.use(passport.session()); // passport session middleware, need to be after express session
passport.use(new LocalStrategy(User.authenticate())); //authenticate setted by the plugin
passport.serializeUser(User.serializeUser()); //serializeUser setted by the plugin
passport.deserializeUser(User.deserializeUser()); //deserializeUser setted by the plugin

app.use((req, res, next) => {
  res.locals.currentUser = req.user; //pass user data in every res
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
}); //render 404 error page

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
}); // handle all errors

//Port setted automaticaly in production mode
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`serving on port ${port}`);
});
