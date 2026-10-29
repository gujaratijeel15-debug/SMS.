const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  serviceName: String,
  price: {
  type: Number,
  default: 500 // default service price
},

  date: Date,
  address: String,

  status: {
    type: String,
    enum: ["pending", "accepted", "completed", "rejected", "cancelled"],
    default: "pending"
  },

  paymentMethod: {
  type: String,
  enum: ["online", "cash"],
  default: null
},

paymentStatus: {
  type: String,
  enum: ["unpaid", "paid"],
  default: "unpaid"
},

paymentId: String, // for online payments

paidAt: Date,

rejectionReason: {
  type: String,
  default: ''
},

review: {
  rating: { type: Number, min: 1, max: 5 },
  response: { type: String, default: '' },
  createdAt: { type: Date }
}
}, { timestamps: true });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

