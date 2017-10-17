const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
   message: String,
   authorName: String,
   authorId: Schema.Types.ObjectId,
   createdAt: {type: Date, default: Date.now}
});

const ConversationSchema = new Schema({
    users: [Schema.Types.ObjectId],
    userNames: [String],
    messages: [MessageSchema]
});

let Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;