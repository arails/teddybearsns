var express = require("express");
var router = express.Router();
var Collection = require("../models/collection");
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
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'webears', 
  api_key: '841871544649225', 
  api_secret: '-B8xjZ0Qzqe6uBOXTjRh_LI3dYM'
});

//INDEX - show all collections
router.get("/", function(req, res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		//Get collections from DB that match search criteria 
    	Collection.find({$or:[{name: regex},{"author.username": regex}]}, function(err, allCollections){
        	if(err){
            	console.log(err);
        	} else {
				if (allCollections.length < 1) {
					noMatch = "No collections match that query. Please try again.";
				}
            	res.render("collections/index", {collections:allCollections, noMatch: noMatch});
        	}
    	});
	} else {
		//Get all collections from DB
    	Collection.find({}, function(err, allCollections){
        	if(err){
            	console.log(err);
        	} else {
            	res.render("collections/index", {collections:allCollections, noMatch: noMatch});
        	}
    	});
	}
        
});

//CREATE - add new collection to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		// add cloudinary url for the image to the campground object under image property
		req.body.image = result.secure_url;
		req.body.imageId = result.public_id;
		// add author to campground
		req.body.author = {
			id: req.user._id,
			username: req.user.username
		};
		Collection.create(req.body.collection, function(err, collection) {
			if (err) {
		    	req.flash('error', err.message);
		    	return res.redirect('back');
			}
			collection.image = req.body.image;
			collection.imageId = req.body.imageId;
			collection.name = req.body.name;
			collection.description = req.body.description;
			collection.author = req.body.author;
			collection.save();
			res.redirect('/collections/' + collection.id);
  		});
	});
});

//NEW - show form to create new collection
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("collections/new"); 
});

//SHOW - shows more info about one collection
router.get("/:id", function(req, res) {
    //find the collection with provided id
    Collection.findById(req.params.id).populate("comments bears").exec(function(err, foundCollection){
        if(err || !foundCollection){
            req.flash("error", "Collection not found");
            res.redirect("back");
        } else {
            //show that collection
            res.render("collections/show", {collection: foundCollection});
        }
    });
});

//EDIT Collection ROUTE
router.get("/:id/edit", middleware.checkCollectionOwnership, function(req, res) {
    Collection.findById(req.params.id, function(err, foundCollection){
        res.render("collections/edit", {collection: foundCollection});
    });
});
//UPDATE Collection ROUTE
router.put("/:id", upload.single('image'), middleware.checkCollectionOwnership, function(req, res){
   Collection.findById(req.params.id, async function(err, collection){
       if(err){
           res.redirect("back");
       } else {
		   	if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(collection.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					collection.imageId = result.public_id;
					collection.image = result.secure_url;	
				} catch(err){
					req.flash("error", "Something went wrong");
            		return res.redirect("back");
				}
			}
		    collection.name = req.body.collection.name;
			collection.description = req.body.collection.description;
		    collection.save();
            res.redirect("/collections/" + req.params.id);
       }
    });
});

//DESTROY Collection ROUTE
router.delete("/:id", middleware.checkCollectionOwnership, function(req, res){
    Collection.findById(req.params.id, async function(err, collection){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
		try {
			await cloudinary.v2.uploader.destroy(collection.imageId);
			collection.remove();
			req.flash("success", "Collection removed");
            res.redirect("/collections");
		} catch(err){
				req.flash("error", "Something went wrong");
            	return res.redirect("back");
		}
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
// turn off

module.exports = router;