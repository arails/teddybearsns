var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Collection = require("../models/collection");
var middleware = require("../middleware");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
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
		// add cloudinary url for the image to the user object under image property
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

// change password
router.get('/change', function(req, res) {
  res.render('change');
});

router.post('/change', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/change');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'webears.pass@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'webears.pass@gmail.com',
        subject: 'WeBears Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/change');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/change');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'webears.pass@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'webears.pass@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/collections');
  });
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

//edit user profile
router.get("/users/:id/edit", middleware.checkUserOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
		if(err) {
			req.flash("error", "Something went wrong.");
			res.redirect("back");
		}
        res.render("users/edit", {user: foundUser});
    });
});

//update user profile
router.put("/users/:id", upload.single('image'), middleware.checkUserOwnership, function(req, res){
   User.findById(req.params.id, async function(err, user){
       if(err){
           res.redirect("back");
       } else {
		   	if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(user.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					user.imageId = result.public_id;
					user.image = result.secure_url;	
				} catch(err){
					req.flash("error", "Something went wrong");
            		return res.redirect("back");
				}
			}
			user.firstName = req.body.user.firstName;
		    user.lastName = req.body.user.lastName;
		    user.location = req.body.user.location;
		    user.email = req.body.user.email;
		    user.aboutMe = req.body.user.aboutMe;
		    user.save();
            res.redirect("/users/" + req.params.id);
       }
    });
});

module.exports = router;