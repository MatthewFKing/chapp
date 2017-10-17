const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const Post = require('./post');


const FriendSchema = new Schema ({
    userID: Schema.Types.ObjectId,
    name: String,
    status: String
});

let UserSchema = new Schema({
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    friends: [FriendSchema],
    conversations: [Schema.Types.ObjectId],
    posts: [Post]
});

UserSchema.statics.authenticate = function(email, password, callback){
	User.findOne({email: email})
		.exec(function (error, user){
			if (error) {
				return callback(error);
			} else if (!user) {
				var err = new Error('User not found');
				err.status = 401;
				return callback(err);
			}
			bcrypt.compare(password, user.password, function(error, result){
				if (result === true) {
					return callback(null, user);
				} else {
					return callback();
				}
			});
		});
};

UserSchema.statics.hash = function(user, callback){
	     bcrypt.hash(user.password, 10, function(err, hash){
		       if (err){
			          return callback(err);
		       }
		user.password = hash;
    user.save();
	});
};

// UserSchema.statics.sendMessage = (toUser, fromUser, messageText, callback) => {

//     let msg = {
//         message: messageText,
//         fromName: fromUser.name,
//         fromId: fromUser._id
//     };
//     let conversation = {
//       users: [toUser._id, fromUser._id],
//       messages: msg
//     };
//     fromUser.inbox.push(conversation);
//     toUser.inbox.push(conversation);
//     toUser.save();
//     fromUser.save();
    
// };

// UserSchema.statics.updateMessage = (users, messageID, messageText, callback) =>{
//     console.log(users);
//     for (let i = 0; i < users.length; i++) {
//         User.findById(users[i])
//             .exec((error, user) =>{
//                 if (error) return callback(error);
//                 console.log(messageID);
//                 console.log(user.inbox);
//                 let conversation = user.inbox.id(messageID);
//                 conversation.messages.push(messageText);
//                 user.save();
//             });
//     }
// };


// const MessageSchema = new Schema({
//   message: String,
//   fromName: String,
//   fromId: Schema.Types.ObjectId,
//   createdAt: {type: Date, default: Date.now}
// });

// const ConversationSchema = new Schema({
//     users: [Schema.Types.ObjectId],
//     messages: [MessageSchema]
// });

let User = mongoose.model('User', UserSchema);

module.exports = User;
