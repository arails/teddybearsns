var Collection = require("../models/collection");
var Bear = require("../models/bear");
var Comment = require("../models/comment");
var Bcomment = require("../models/bcomment");
//all the middleware goes here
var middlewareObj = {};

middlewareObj.checkCollectionOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Collection.findById(req.params.id, function(err, foundCollection){
            if(err || !foundCollection){
                req.flash("error", "Collection not found");
                res.redirect("back");
            } else {
                //does user own collection?
                if(foundCollection.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkBearOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Bear.findById(req.params.bear_id, function(err, foundBear){
            if(err || !foundBear){
                req.flash("error", "Bear not found");
                res.redirect("back");
            } else {
                //does user own bear?
                if(foundBear.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                //does user own comment?
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkBcommentOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Bear.findById(req.params.bear_id, function(err, foundBear){
            if(err || !foundBear){
                req.flash("error", "Bear not found");
                res.redirect("back");
            } else {
        
			Bcomment.findById(req.params.bcomment_id, function(err, foundBcomment){
				if(err || !foundBcomment){
					req.flash("error", "Comment not found");
					res.redirect("back");
				} else {
					//does user own comment?
					if(foundBcomment.author.id.equals(req.user._id) || req.user.isAdmin) {
						next();
					} else {
						req.flash("error", "You don't have permission to do that to do that");
						res.redirect("back");
					}
				}
			});
		   }
		});
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObj;