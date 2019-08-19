var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Collection = require("../models/collection");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SECRET,
});

//root route
router.get("/", function(req, res){
    res.render("landing");
});


//show sign up form
router.get("/register", function(req, res) {
   res.render("register"); 
});
//handle sign up logic
router.post("/register", upload.single('image'), function(req, res) {
	cloudinary.uploader.upload(req.file.path, function(result) {
		// add cloudinary url for the image to the campground object under image property
		req.body.image = result.secure_url;
		req.body.imageId = result.public_id;
    	var newUser = new User({
				username: req.body.username, 
				image: req.body.image,
				imageId: req.body.imageId,
				firstName: req.body.firstName, 
				lastName: req.body.lastName, 
				email: req.body.email, 
				location: req.body.location, 
				aboutMe: req.body.aboutMe
		});
    	if(req.body.adminCode === process.env.ADMIN_CODE) {
        	newUser.isAdmin = true;
    	}
    	User.register(newUser, req.body.password, function(err, user){
			if(err){
				req.flash("error", err.message);
				return res.redirect("/register");
			}
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to WeBears " + user.username);
				res.redirect("/collections");
			});
    	});
	});
});

//show login form
router.get("/login", function(req, res) {
    res.render("login");
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/collections", 
        failureRedirect: "/login"
        
    }), function(req, res) {
    
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/collections");
});

//user profile
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			req.flash("error", "Something went wrong.");
			res.redirect("/");
		}
		Collection.find().where('author.id').equals(foundUser._id).exec(function(err, collections) {
			if(err) {
			req.flash("error", "Something went wrong.");
			res.redirect("/");
		}
		res.render("users/show", {user: foundUser, collections: collections});
		});
	});
});

module.exports = router;