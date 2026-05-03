const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.userId;

    // Create a predictable conversationId: minId_maxId
    const ids = [senderId, receiverId].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      message
    });

    await newMessage.save();

    // Emitting via Socket.IO will be done in server.js or we can pass io to controller
    // but easier to emit from client or server.js when saving via socket
    
    // Create a notification for the receiver
    const senderUser = await User.findById(senderId);
    const senderName = senderUser ? senderUser.name : 'Someone';
    
    const notification = new Notification({
      userId: receiverId,
      conversationId,
      type: 'message',
      title: `New message from ${senderName}`,
      message: message.length > 50 ? message.substring(0, 47) + '...' : message
    });
    
    await notification.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessages, sendMessage };
