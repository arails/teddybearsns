var express = require("express");
var router = express.Router();
var Collection = require("../models/collection");
var middleware = require("../middleware");

//INDEX - show all collections
router.get("/", function(req, res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		//Get collections from DB that match search criteria 
    	Collection.find({name: regex}, function(err, allCollections){
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
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to collections array
  var name = req.body.name;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  };
    var newCollection = {name: name, description: desc, author:author};
    // Create a new collection and save to DB
    Collection.create(newCollection, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to collections page
            console.log(newlyCreated);
            res.redirect("/collections");
        }
    });
  // });
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
router.put("/:id", middleware.checkCollectionOwnership, function(req, res){
    Collection.findByIdAndUpdate(req.params.id, req.body.collection, function(err, collection){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/collections/" + collection._id);
        }
    });
  // });
});

//DESTROY Collection ROUTE
router.delete("/:id", middleware.checkCollectionOwnership, function(req, res){
    Collection.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/collections");
        } else {
            res.redirect("/collections");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;