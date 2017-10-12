function requiresLogin(req, res, next) {
	if (req.session && req.session.userId){
		return next();
	} else {
		var err = new Error('You must be logged in');
		err.status = 401;
		return next(err);
	}
}

module.exports.requiresLogin = requiresLogin;
