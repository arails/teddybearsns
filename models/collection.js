var mongoose = require("mongoose");

var collectionSchema = new mongoose.Schema({
    name: String,
    description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        username: String,
    },
	bears: [
	  {
		type: mongoose.Schema.Types.ObjectId,
		  ref: "Bear"
	  }
	],
    comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Collection", collectionSchema);