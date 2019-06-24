var express = require("express");
var router = express.Router({mergeParams: true});
var Collection = require("../models/collection");
var Bear = require("../models/bear");
var middleware = require("../middleware");

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
router.post("/", middleware.isLoggedIn, function(req, res){
   //look up collection using id
   Collection.findById(req.params.id, function(err, collection){
       if(err){
            console.log(err);
            res.redirect("/collections");
       } else {
                //create new bear
                Bear.create(req.body.bear, function(err, bear){
                    if(err){
                        req.flash("error", "Something went wrong");
                        console.log(err);
                    } else {
                        //add properties to bear
						bear.image = req.body.image;
						bear.name = req.body.name;
						bear.type = req.body.type;
						bear.material = req.body.material;
						bear.price = req.body.price;
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
router.put("/:bear_id", middleware.checkBearOwnership, function(req, res){
    Bear.findByIdAndUpdate(req.params.bear_id, req.body.bear, function(err, updatedBear){
       if(err){
           res.redirect("back");
       } else {
           res.redirect("/collections/" + req.params.id);
       }
    });
});

//bears destroy
router.delete("/:bear_id", middleware.checkBearOwnership, function(req, res){
    Bear.findByIdAndRemove(req.params.bear_id, function(err){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else {
            req.flash("success", "Bear removed");
            res.redirect("/collections/" + req.params.id);
        }
    });
});

module.exports = router;