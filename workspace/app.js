const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ioCookieParser = require('socket.io-cookie');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

mongoose.connect("mongodb://localhost:27017/chapp");
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

app.use(session({
	secret: 'chapp',
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: db
	})
}));

app.use(function(req, res, next){
	res.locals.currentUser = req.session.userId;
	next();
});


app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

io.use(ioCookieParser);

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

let routes = require('./routes/index.js');
app.use('/', routes);

app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.on('connection', (socket) => {
  socket.emit('working', socket.id);
  console.log('user joined');
  socket.on('message', (msg) => {
    console.log(socket.id);
		let data = {
			name: socket.request.name,
			msg: msg,
			socket: socket.id
		};
    io.emit('message', data);
  });
});


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  const addr = server.address();
  console.log("Server running at", addr.address + ":" + addr.port);
});
