const mongoose = require("mongoose")

const schema = mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    minlength: 2,
    maxlenght: 100
  },
  itemAmount: {
    type: String,
    maxlenght: 20
  },
  itemNote: {
    type: String,
    maxlenght: 160
  }
})
module.exports = mongoose.model("Item", schema)
