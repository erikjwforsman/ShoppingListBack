const mongoose = require("mongoose")

const schema = new mongoose.Schema({
  listName: {
    type: String,
    required: true,
    minlength: 2,
    maxlenght: 70
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  }],
  listMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
})


module.exports = mongoose.model("Shopping_list", schema)
