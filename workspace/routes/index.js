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

///////////////////////////////////
///Messages
///////////////////////////////////


router.post('/replymsg/:mID', (req, res, next) =>{
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

router.get('/message/:mID', (req,res,next) =>{
    Conversation.findById(req.params.mID)
        .exec((error, conversation) => {
            if(error) return next(error);
                res.render('message', {message: conversation});
        });
});

router.get('/inbox', (req, res, next) => {
    User.findById(req.session.userId)
        .exec((error, user) => {
            if (error) return next(error);
            Conversation.find({users: user._id})
                .exec((error, conversations) =>{
                    res.render('inbox', {data: user, messages: conversations});
                });
        });
});

router.get('/sendmsg/:uID', (req, res, next) =>{
  res.render('sendmsg',{user: req.user});
});

router.post('/sendmsg/:uID', (req, res, next) =>{
    
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

router.get('/profile/:uID', (req, res, next) =>{
    
    
    
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

router.get('/', (req, res, next) =>{
    
    
	User.findById(req.session.userId)
		.exec((error, user) =>{
			if (error) {
				return next(error);
			} else if (!user) {
				res.render('login');
			} else {
			    res.render('index', {name: user.name});
			}
		});
});


///////////////////////////////////
///Login & Signup
///////////////////////////////////

router.get('/login', (req, res) =>{
	res.render('login');
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

router.get('/users', (req, res, next) =>{
	User.find({},{name: 1})
		.exec((error, users) =>{
			if (error) {
				return next(error);
			} else {
				res.render('users', {data: users});
			}
		});
});



router.get('/friendlist/:uID', (req, res, next)=> {
      res.render('friendlist', {data: req.user.friends});
});

router.get('/reqfriend/:uID', (req, res, next) =>{
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
///  WIP
///////////////////////////////////


router.post('/post', (req,res,next) =>{
   let options = {
       screenSize: {
        width: 1024,
        height: 1500
        },
       shotsize: {
           width: 'all',
           height: 'all'
       }
   };
   
   let url = req.body.webshotLink;
   
    request(url, (err, response, html) =>{
       if (err) return next(err);
       let $ = cheerio.load(html);
       let htmlTitle = $('title').text();

       let postData = {
           linkUrl: url,
           title: htmlTitle
       };
       
       Post.create(postData, (err, post) => {
          if (err) return next(err);
          
          webshot(url, `${post._id}.png` ,options, function(err) {
            if(err) return next(err);
            console.log('saved');
       });
        
        post.imgFileName = post._id + '.png';
        post.save();
    });
    res.redirect('back');
});
    
    
    
    
});


module.exports = router;
