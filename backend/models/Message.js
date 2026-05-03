const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:        { type: String, required: true },
  timestamp:      { type: Date, default: Date.now },
  read:           { type: Boolean, default: false }
});

// conversationId can be a combination of patientId_hospitalId or similar for easy fetching
module.exports = mongoose.model('Message', messageSchema);
