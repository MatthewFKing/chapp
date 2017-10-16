const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const MessageSchema = new Schema({
   message: String,
   fromName: String,
   fromId: Schema.Types.ObjectId,
   createdAt: {type: Date, default: Date.now}
});

const ConversationSchema = new Schema({
    users: [Schema.Types.ObjectId],
    messages: [MessageSchema]
});

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
    inbox: [ConversationSchema]
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

UserSchema.statics.sendMessage = (toUser, fromUser, messageText, callback) => {

    let msg = {
        message: messageText,
        fromName: fromUser.name,
        fromId: fromUser._id
    };
    let conversation = {
      users: [toUser._id, fromUser._id],
      messages: msg
    };
    fromUser.inbox.push(conversation);
    toUser.inbox.push(conversation);
    toUser.save();
    fromUser.save();
    
};

UserSchema.statics.updateMessage = (users, messageID, messageText, callback) =>{
    for (let i = 0; i < users.length; i++) {
        User.findById(users[i]._id)
            .exec((error, user) =>{
                if (error) return callback(error);
                for ( let x = 0; x < user.inbox.length; x++) {
                    if (user.inbox[i]._id.equals(messageID)) {
                        
                        user.inbox[i].push();
                    }
                }
            });
    }
};

let User = mongoose.model('User', UserSchema);

module.exports = User;
