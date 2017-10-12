const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const MessageSchema = new Schema({
   message: String,
   conversationId: Schema.Types.ObjectId,
   createdAt: {type: Date, default: Date.now},
   status: String
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

UserSchema.statics.addFriend = (toData,fromId, callback) =>{
    console.log(fromId);
    User.findOne({_id: fromId})
        .exec((error, user) =>{
           if (error) {
               return callback(error);
           } else if (!user) {
               let err = new Error('No User Found');
               err.status = 401;
               return callback(err);
           }
           let newFriend = {
               userID: toData._id,
               name: toData.name,
               status: 'friend'
               };
               
            user.friends.push(newFriend);
            user.save();
            
            return (null, user);
        });
};

UserSchema.statics.sendMsg = (userData, email, msg, callback) =>{
    User.findOne({email: email})
        .exec((error, user) =>{
            if (error) {
                return callback(error);
            } else if (!user) {
                let err = new Error('No User Found');
                err.status = 401;
                return callback(err);
            }
            let message = {
                message: msg,
                status: 'unread'
            };
            let conversation = {
                users: ['59de7541be27b37583f88c1d', '59de7541be27b37583f88c1c'],
                messages: message
            };
            user.inbox.push(conversation);
            user.save();
        });
};

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

UserSchema.pre('save', function(next){
	var user = this;
	bcrypt.hash(user.password, 10, function(err, hash){
		if (err){
			return next(err);
		}
		user.password = hash;
		next();
	});
});

let User = mongoose.model('User', UserSchema);

module.exports = User;