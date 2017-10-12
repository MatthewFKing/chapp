const express = require('express');
const router = express.Router();
const User = require('../models/user');
const mid = require('../middleware');

router.get('/profile', mid.requiresLogin, (req, res, next) => {
	User.findById(req.session.userId)
		.exec((error, user) =>{
			if (error) {
				return next(error);
			} else {
				res.render('profile', {name: user.name});
			}
		});
});

router.get('/', (req, res) =>{
	User.findById(req.session.userId)
		.exec((error, user) =>{
			if (error) {
				return next(error);
			} else {
				res.render('index', {name: user.name});
			}
		});
});

router.get('/login', (req, res) =>{
	res.render('login');
});

router.get('/users', (req, res, next) =>{
	User.find({},{name: 1, _id:0})
		.exec((error, users) =>{
			if (error) {
				return next(error);
			} else {
				res.render('users', {data: users});
			}
		});
});

router.get('/logout', (req, res) =>{
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
        res.redirect('/');
      }
    });
  } else {
    let err = new Error('Please fill in all fields.');
    err.status = 400;
    return next(err);
  }
});

router.get('/test', (req, res, next) =>{
    let testUser1 = new User({
        email: 'test@test.com',
        name: 'test1',
        password: '123',
        friends: [],
        inbox: []
    });

    let testUser2 = new User({
        email: 'test2@test.com',
        name: 'test2',
        password: '123',
        friends: [],
        inbox: []
    });

    User.create(testUser1, (error, user) =>{
        if (error){
            return next(error);
        } else {
            User.create(testUser2, (error, user) =>{
        if (error){
            return next(error);
        } else {
            res.redirect('/');
        }
    });
        }
    });


});

router.get('/friend-test', (req, res, next) =>{

    let userData = {
      name: 'test2',
      objectId: '59de6939420fa86788a02f98'
    };
    let email = 'test@test.com';

  User.addFriend(userData, email, (error, user) =>{
     if (error){
         let err = new Error('Nope');
         err.status = 401;
         next(err);
     } else {
         console.log(user);
     }
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
