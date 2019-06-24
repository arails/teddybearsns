var express = require("express");
var router = express.Router({mergeParams: true});
var Collection = require("../models/collection");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//comments new
router.get("/new", middleware.isLoggedIn, function(req, res) {
    // find collection by id
    Collection.findById(req.params.id, function(err, collection){
       if(err){
            console.log(err);
       } else {
            res.render("comments/new", {collection: collection});
       }
    });
});

//comments create
router.post("/", middleware.isLoggedIn, function(req, res){
   //look up collection using id
   Collection.findById(req.params.id, function(err, collection){
       if(err){
            console.log(err);
            res.redirect("/collections");
       } else {
            //create new comment
            Comment.create(req.body.comment, function(err, comment){
               if(err){
                   req.flash("error", "Something went wrong");
                   console.log(err);
               } else {
                   //add username and id to comment
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   //save comment
                   comment.save();
                   //connect new comment to collection
                   collection.comments.push(comment);
                   collection.save();
                   //redirect collection show page
                   req.flash("success", "Successfully added comment");
                   res.redirect("/collections/" + collection._id);
               }
            });
       }
    });
});

//comments edit
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Collection.findById(req.params.id, function(err, foundCollection) {
        if(err || !foundCollection){
            req.flash("error", "Collection not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if(err){
                res.redirect("back");
            } else {
                res.render("comments/edit", {collection_id: req.params.id, comment: foundComment});
            }
        });
    });
});
//comments update
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if(err){
           res.redirect("back");
       } else {
           res.redirect("/collections/" + req.params.id);
       }
    });
});

//comments destroy
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/collections/" + req.params.id);
        }
    });
});

module.exports = router;