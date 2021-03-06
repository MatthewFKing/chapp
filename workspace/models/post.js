const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
   linkUrl: String,
   imgFileName: String,
   title: String,
   createdAt: {type: Date, default: Date.now},
   author: Schema.Types.ObjectId
});

let Post = mongoose.model('Post', PostSchema);

module.exports = Post;
