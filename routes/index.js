var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Collection = require("../models/collection");

//root route
router.get("/", function(req, res){
    res.render("landing");
});


//show sign up form
router.get("/register", function(req, res) {
   res.render("register"); 
});
//handle sign up logic
router.post("/register", function(req, res) {
    var newUser = new User({
			username: req.body.username, 
			avatar: req.body.avatar, 
			firstName: req.body.firstName, 
			lastName: req.body.lastName, 
			email: req.body.email, 
			location: req.body.location, 
			aboutMe: req.body.aboutMe
		});
    if(req.body.adminCode === "amiBanana0620") {
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