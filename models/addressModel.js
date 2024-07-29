const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   details: [{
      name: {
         type: String,
         required: true
      },
      housename: {
         type: String,
         required: true
      },
      street: {
         type: String,
         required: true
      },
      landmark: {
         type: String,
         required: true
      },
      pin: Number,
      district: {
         type: String,
         required: true
      },
      state: {
         type: String,
         required: true
      },
      country: {
         type: String,
         default: "India"
      },
      contact: Number,
      select: {
         type: Boolean,
         default: false
      }
   }]

});
const Address = mongoose.model('Address', addressSchema);
module.exports = Address;