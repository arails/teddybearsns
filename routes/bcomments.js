var express = require("express");
var router = express.Router({mergeParams: true});
var Bear = require("../models/bear");
var Bcomment = require("../models/bcomment");
var Collection = require("../models/collection");
var middleware = require("../middleware");

//bcomments new
router.get("/new", middleware.isLoggedIn, function(req, res) {
	Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
			console.log(err);
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back");
            } else {
                res.render("bcomments/new", {id: req.params.id, bear_id: req.params.bear_id, bear: foundBear, collection: foundCollection});
            }
        });
    });
});

//bcomments create
router.post("/", middleware.isLoggedIn, function(req, res){
	Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
			console.log(err);
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back");
            } else {
               //create new bcomment
               Bcomment.create(req.body.bcomment, function(err, bcomment){
                  if(err){
                      req.flash("error", "Something went wrong");
                      console.log(err);
                  } else {
                      //add username and id to bcomment
                      bcomment.author.id = req.user._id;
                      bcomment.author.username = req.user.username;
                      //save bcomment
                      bcomment.save();
                      //connect new bcomment to bear
                      foundBear.bcomments.push(bcomment);
                      foundBear.save();
                      //redirect bear show page
                      req.flash("success", "Successfully added comment");
                      res.redirect("/collections/" + foundCollection._id + "/bears/" + foundBear._id);
                  }
               });
            }
         });
	});	
 });

//bcomments edit
router.get("/:bcomment_id/edit", middleware.checkBcommentOwnership, 
		   function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
			console.log(err);
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back");
            }
				Bcomment.findById(req.params.bcomment_id, function(err, foundBcomment) {
					if(err){
						res.redirect("back");
					} else {
						res.render("bcomments/edit", {id: req.params.id, bear_id: req.params.bear_id, bcomment: foundBcomment, bear: foundBear, collection: foundCollection});
					}
				});
        });
    });
});
//bcomments update
router.put("/:bcomment_id", middleware.checkBcommentOwnership, 
		   function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
			console.log(err);
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back");
            } else {
			Bcomment.findByIdAndUpdate(req.params.bcomment_id, req.body.bcomment, function(err, updatedBcomment){
			   if(err){
				   res.redirect("back");
			   } else {
				   res.redirect("/collections/" + req.params.id + "/bears/" + req.params.bear_id);
			   }
			});
		   }
		});
	});
});

//bcomments destroy
router.delete("/:bcomment_id", middleware.checkBcommentOwnership, 
			  function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
			console.log(err);
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Bear.findById(req.params.bear_id, function(err, foundBear) {
            if(err){
                res.redirect("back");
            } else {
			Bcomment.findByIdAndRemove(req.params.bcomment_id, function(err){
				if(err){
					req.flash("error", "Something went wrong");
					res.redirect("back");
				} else {
					req.flash("success", "Comment deleted");
					res.redirect("/collections/" + req.params.id + "/bears/" + req.params.bear_id);
				}
			});
		  }
	   });
	});
});

module.exports = router;