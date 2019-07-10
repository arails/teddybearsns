var mongoose = require("mongoose");

var bearSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: String,
    material: String,
    price: String,
	where: String,
	when: String,
	birthday: String,
	artist: String,
    description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        username: String,
    },
    bcomments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Bcomment"
      }
   ]
});

module.exports = mongoose.model("Bear", bearSchema);