const express = require('express');
const router = express.Router();
const User = require('../models/user');
const mid = require('../middleware');
const Conversation = require('../models/conversation');
const webshot = require('webshot');
const request = require('request');
const cheerio = require('cheerio');
const Post = require('../models/post');

router.param('uID', function(req, res, next, id){
	User.findById(id, function(err, doc){
		if(err) return next(err);
		if(!doc) {
			err = new Error('Not Found');
			err.status = 404;
			return next(err);
		}
		req.user = doc;
		return next();
	});
});

router.param('pID', function(req, res, next, id){
	Post.findById(id, function(err, doc){
		if(err) return next(err);
		if(!doc) {
			err = new Error('Not Found');
			err.status = 404;
			return next(err);
		}
		req.post = doc;
		return next();
	});
});



///////////////////////////////////
///Messages
///////////////////////////////////


router.post('/replymsg/:mID', mid.requiresLogin, (req, res, next) =>{
    Conversation.findById(req.params.mID)
    .exec((err, conversation) =>{
        if (err) return next(err);
        let messageData = {
            message: req.body.message,
            authorName: req.session.username,
            authorId: req.session.userId
        };
        conversation.messages.push(messageData);
        conversation.save();
        res.redirect('back');
    });
});

router.get('/message/:mID', mid.requiresLogin, (req,res,next) =>{
    Conversation.findById(req.params.mID)
        .exec((err, conversation) => {
            if(err) return next(err);
                res.render('message', {message: conversation});
        });
});

router.get('/inbox', mid.requiresLogin, (req, res, next) => {
    User.findById(req.session.userId)
        .exec((err, user) => {
            if (err) return next(err);
            Conversation.find({users: user._id})
                .exec((err, conversations) =>{
                    if (err) return next(err);
                    res.render('inbox', {data: user, messages: conversations});
                });
        });
});

router.get('/sendmsg/:uID', mid.requiresLogin, (req, res, next) =>{
  res.render('sendmsg',{user: req.user});
});

router.post('/sendmsg/:uID', mid.requiresLogin, (req, res, next) =>{

    //users - req.sessions.userId & req.user
    //message - req.body.message
    let messageData = {
         message: req.body.message,
         authorName: req.session.username,
         authorId: req.session.userId
        };

    let conversationData = {
        users: [req.user._id,req.session.userId],
        userNames: [req.user.name, req.session.username],
        messages: messageData
    };

    Conversation.create(conversationData, (err, conversation) =>{
        if (err) return next(err);

        req.user.conversations.push(conversation._id);
        req.user.save();

        User.findById(req.session.userId)
            .exec((err, user) =>{
                if (err) return next(err);
                user.conversations.push(conversation._id);
                user.save();
            });
    });
    res.redirect('back');

//     User.findById(req.session.userId)
//         .exec((error, fromUser) =>{
//             if(error) return next(error);
//         User.sendMessage(req.user, fromUser, req.body.message, function(error, user){
// 			if(error || !user){
// 				var err = new Error('Message not sent');
// 				err.status = 401;
// 				return next(err);
// 			}
//     });
//     res.render('profile', {data: req.user, friend: true});

//  });

});

///////////////////////////////////
///Profile
///////////////////////////////////

router.get('/profile/:uID', mid.requiresLogin, (req, res, next) =>{



    User.findById(req.session.userId)
        .exec((error, user) => {
           if (error) return next(error);
           for (let i = 0; i < user.friends.length; i++) {
               if (user.friends[i].userID.equals(req.user._id)){
                   console.log('matched');
                  return res.render('profile', {data: req.user, friend: true});
               }
           }
           res.render('profile', {data: req.user, friend: false});
        });
});

router.get('/profile', mid.requiresLogin, (req, res, next) => {
    console.log(req.session);
	User.findById(req.session.userId)
		.exec((error, user) =>{
			if (error) {
				return next(error);
			} else {
				res.render('profile', {data: user});
			}
		});
});

///////////////////////////////////
///Home
///////////////////////////////////

router.get('/', mid.requiresLogin, (req, res, next) =>{
	Post.find({author: req.session.userId})
		.exec((err, userPosts) =>{
			if (err) return next(err);
			return res.render('index', {posts: userPosts});
		});
});


///////////////////////////////////
///Login & Signup
///////////////////////////////////

router.get('/login', (req, res) =>{
	return res.render('login');
});



router.get('/logout', (req, res, next) =>{
  if(req.session){
		req.session.destroy(function(err){
			if (err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

router.post('/login', (req, res, next) =>{
    if (req.body.email && req.body.password){
		User.authenticate(req.body.email, req.body.password, function(error, user){
			if(error || !user){
				var err = new Error('Wrong email or password.');
				err.status = 401;
				return next(err);
			} else {
				req.session.userId = user._id;
				req.session.username = user.name;
				return res.redirect('/profile');
			}
		});
	} else {
		var err = new Error('Email and password are required.');
		err.status = 401;
		next(err);
	}
});

router.get('/signup', (req, res) =>{
  res.render('signup');
});

router.post('/signup', (req, res, next) =>{
  if (req.body.name &&
    req.body.email &&
    req.body.password &&
    req.body.confirmPassword){

      if(req.body.password !== req.body.confirmPassword){
        let err = new Error('Passwords do not match');
        err.status = 401;
        return next(err);
      }
    let userData = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    };

    User.create(userData, (error, user) =>{
      if (error){
        return next(error);
      } else {
      User.hash(user, (error, user) =>{
        if (error) return next(error);
      });
    }
    req.session.userId = user._id;
    req.session.username = user.name;
	return res.redirect('/profile');
    });

  } else {
    let err = new Error('Please fill in all fields.');
    err.status = 400;
    return next(err);
  }


});

///////////////////////////////////
///Users & Friends
///////////////////////////////////

router.get('/users', mid.requiresLogin, (req, res, next) =>{
	User.find({},{name: 1})
		.exec((error, users) =>{
			if (error) {
				return next(error);
			} else {
				res.render('users', {data: users});
			}
		});
});



router.get('/friendlist/:uID', mid.requiresLogin, (req, res, next)=> {
      res.render('friendlist', {data: req.user.friends});
});

router.get('/reqfriend/:uID', mid.requiresLogin, (req, res, next) =>{
    User.findById(req.session.userId, (err, me) =>{
        if (err) console.log(err);
        User.findById(req.params.uID, (err, reqdFriend) =>{
           if (err) console.log(err);
                me.friends.push({
                    userID: reqdFriend._id,
                    name: reqdFriend.name,
                    status: 'Pending'
                });
                reqdFriend.friends.push({
                   userID: me._id,
                   name: me.name,
                   status: 'Pending'
                });
                me.save();
                reqdFriend.save();
                return res.redirect('/profile');
        });
    });
});

///////////////////////////////////
///  Posts
///////////////////////////////////


router.post('/post', mid.requiresLogin, (req,res,next) =>{


   let url = req.body.webshotLink;

    request(url, (err, response, html) =>{
       if (err) return next(err);
       let $ = cheerio.load(html);
       let htmlTitle = $('title').text();
			 console.log(htmlTitle);
			 
        if (htmlTitle.length > 40){
            htmlTitle = htmlTitle.slice(0,37) + "...";
        }
        
       let postData = {
           linkUrl: url,
           title: htmlTitle,
		   author: req.session.userId
       };

       Post.create(postData, (err, post) => {
          if (err) return next(err);

			let options = {
					quality: 5,
					siteType:'html',
					streamType: 'jpeg'
	        };

			post.imgFileName = `${post._id}.png`;
			post.save();
			
			

          webshot(html, `./public/images/${post._id}.png` ,options, function(err) {
            if(err) return next(err);
            User.findById(req.session.userId)
			    .exec((err, user) => {
			       if (err) return next(err);
			       user.posts.push(post._id);
			    });
            console.log('saved');
				return res.redirect('back');		
            });
            
        });
    });
});

router.delete('/post/:pID', (req, res, next) =>{
    
    req.post.remove((err) =>{
        if (err){
           return next(err); 
        } else {
        return res.send('done');
        }
    });
    
});




module.exports = router;
