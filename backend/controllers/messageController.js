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

// GET /messages/conversations/:userId — all unique chat partners
const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    // Find all messages where this user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ timestamp: -1 });

    // Build a map of unique partner IDs → latest message
    const partnerMap = new Map();
    messages.forEach(m => {
      const partnerId = m.senderId.toString() === userId ? m.receiverId.toString() : m.senderId.toString();
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, m);
      }
    });

    // Populate partner details
    const conversations = await Promise.all(
      Array.from(partnerMap.entries()).map(async ([partnerId, lastMsg]) => {
        const partner = await User.findById(partnerId, 'name role');
        return {
          partnerId,
          partnerName: partner ? partner.name : 'Unknown',
          lastMsg: lastMsg.message,
          lastTime: new Date(lastMsg.timestamp).getTime(),
          dateStr: (() => {
            const d = new Date(lastMsg.timestamp);
            return d.toDateString() === new Date().toDateString()
              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          })()
        };
      })
    );

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessages, sendMessage, getConversations };
