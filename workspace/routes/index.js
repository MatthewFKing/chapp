const express = require('express');
const router = express.Router();
const User = require('../models/user');
const mid = require('../middleware');

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

router.get('/sendmsg/:uID', (req, res, next) =>{
  res.render('sendmsg',{user: req.user});
});

router.get('/profile/:uID', (req, res, next) =>{
   console.log(req.params.uID);
   User.findById(req.params.uID)
    .exec((error, user) =>{
       if (error) {
           return next(error);
       } else {
           res.render('profile', {data: user});
       }

       });
});

router.get('/profile', mid.requiresLogin, (req, res, next) => {
	User.findById(req.session.userId)
		.exec((error, user) =>{
			if (error) {
				return next(error);
			} else {
				res.render('profile', {data: user});
			}
		});
});

router.get('/', (req, res, next) =>{
    console.log(req.session);
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

router.get('/login', (req, res) =>{
	res.render('login');
});

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
				console.log(req.session.userId);
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
    res.redirect('/');
    });

  } else {
    let err = new Error('Please fill in all fields.');
    err.status = 400;
    return next(err);
  }


});

router.get('/post', (req,res,next) =>{
   res.render('post');
});

router.get('/friendlist/:uID', (req, res, next)=> {
   User.findById(req.params.uID, (err, user) =>{
      if (err) console.log(err);
      res.render('friendlist', {data: user.friends});
   });
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
        });
    });
});


router.get('/msg-test', (req, res, next) => {
    let userData = {
      name: 'test2',
      objectId: '59de6939420fa86788a02f98'
    };
    let email = 'test@test.com';
    let msg = 'Hello';
    User.sendMsg(userData, email, msg, (error, user) =>{
       if (error) {
           let err = new Error('nope');
           err.status = 401;
           next(err);
       } else {
           console.log(user);
       }
    });
});

module.exports = router;
