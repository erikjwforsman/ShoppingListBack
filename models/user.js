const mongoose = require("mongoose")


const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 1
  },

  user_shopping_lists: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Shopping_list"
  }],

  userContacts: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }]

})
module.exports = mongoose.model("User", schema)
