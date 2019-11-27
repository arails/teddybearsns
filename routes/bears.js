var express = require("express");
var router = express.Router({mergeParams: true});
var Collection = require("../models/collection");
var Bear = require("../models/bear");
var middleware = require("../middleware");
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

//bears new
router.get("/new", middleware.isLoggedIn, function(req, res) {
    // find collection by id
    Collection.findById(req.params.id, function(err, collection){
       if(err){
            console.log(err);
       } else {
            res.render("bears/new", {collection: collection});
       }
    });
});

//bears create
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
   //look up collection using id
   Collection.findById(req.params.id, function(err, collection){
       if(err){
            console.log(err);
            res.redirect("/collections");
       } else {
                //create new bear
		   		cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
  					if(err) {
						req.flash('error', err.message);
						return res.redirect('back');
					}
					// add cloudinary url for the image to the bear object under image property
  					req.body.image = result.secure_url;
					req.body.imageId = result.public_id;
				
					Bear.create(req.body.bear, function(err, bear){
						if(err){
							req.flash("error", "Something went wrong");
							console.log(err);
						} else {
							//add properties to bear
							bear.image = req.body.image;
							bear.imageId = req.body.imageId;
							bear.name = req.body.name;
							bear.type = req.body.type;
							bear.material = req.body.material;
							bear.price = req.body.price; 
							bear.where = req.body.where;
							bear.when = req.body.when;
							bear.birthday = req.body.birthday;
							bear.artist = req.body.artist;
							bear.description = req.body.description;
							//add username and id to bear
							bear.author.id = req.user._id;
							bear.author.username = req.user.username;
							//save bear
							bear.save();
							//connect new bear to collection
							collection.bears.push(bear);
							collection.save();
							//redirect collection show page
							req.flash("success", "Successfully added bear");
							res.redirect("/collections/" + collection._id);
						}
				   });
				});
        }
    });
});

//SHOW - shows more info about one collection
router.get("/:bear_id", middleware.isLoggedIn, function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id).populate("bcomments").exec(function(err, foundBear){
            if(err){
                res.redirect("back");
            } else {
                res.render("bears/show", {collection_id: req.params.id, bear: foundBear, collection: foundCollection});
            }
        });
    });
});

//bears edit
router.get("/:bear_id/edit", middleware.checkBearOwnership, function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back"); 
            } else {
                res.render("bears/edit", {collection_id: req.params.id, bear: foundBear, collection: foundCollection});
            }
        });
    });
});

//bears update
router.put("/:bear_id", upload.single('image'), middleware.checkBearOwnership, function(req, res){
    Bear.findById(req.params.bear_id, async function(err, bear){
       if(err){
           res.redirect("back");
       } else {
		   	if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(bear.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					bear.imageId = result.public_id;
					bear.image = result.secure_url;	
				} catch(err){
					req.flash("error", "Something went wrong");
            		return res.redirect("back");
				}
			}
		    bear.name = req.body.bear.name;
			bear.type = req.body.bear.type;
			bear.material = req.body.bear.material;
			bear.price = req.body.bear.price; 
			bear.where = req.body.bear.where;
			bear.when = req.body.bear.when;
			bear.birthday = req.body.bear.birthday;
			bear.artist = req.body.bear.artist;
			bear.description = req.body.bear.description;
		    bear.save();
            res.redirect("/collections/" + req.params.id);
       }
    });
});

//bears destroy
router.delete("/:bear_id", middleware.checkBearOwnership, function(req, res){
    Bear.findById(req.params.bear_id, async function(err, bear){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
		try {
			await cloudinary.v2.uploader.destroy(bear.imageId);
			bear.remove();
			req.flash("success", "Bear removed");
            res.redirect("/collections/" + req.params.id);
		} catch(err){
				req.flash("error", "Something went wrong");
            	return res.redirect("back");
		}
    });
});

module.exports = router;