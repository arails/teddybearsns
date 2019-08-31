require("dotenv").config();
const express       = require("express"),
    app           = express(),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    flash         = require("connect-flash"),
    passport      = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Collection    = require("./models/collection"),
    Comment       = require("./models/comment"),
	Bear		  = require("./models/bear"),
	Bcomment       = require("./models/bcomment"),
    User          = require("./models/user"),
    seedDB        = require("./seeds");

//requiring routes    
var commentRoutes    = require("./routes/comments"),
    collectionRoutes = require("./routes/collections"),
	bearRoutes		 = require("./routes/bears"),
	bcommentRoutes  = require("./routes/bcomments"),
    indexRoutes      = require("./routes/index");
mongoose.connect(process.env.MONGOOSE_CONNECT, {
	useNewUrlParser: true,
	useCreateIndex: true,
}).then(() => {
	console.log('Connected to DB!');	
}).catch(err => {
	console.log('Error:', err.message);
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: process.env.PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/collections/:id/comments", commentRoutes);
app.use("/collections/:id/bears/:bear_id/bcomments", bcommentRoutes);
app.use("/collections/:id/bears", bearRoutes);
app.use("/collections", collectionRoutes);



app.listen(process.env.PORT || 3000, () => {
	console.log('server is listening on port 3000');
});