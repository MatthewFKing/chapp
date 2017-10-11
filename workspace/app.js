const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ioCookieParser = require('socket.io-cookie');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

io.use(ioCookieParser);

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get('/', (req, res) =>{
  if(req.cookies.name){
  res.render('index', {name: req.cookies.name});
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) =>{
if (req.cookies.name){
	  res.redirect('/');
	} else {
	  res.render('login');
	}
});

app.get('/logout', (req, res) =>{
  res.clearCookie('name');
  res.redirect('/');
});

app.post('/login', (req, res) =>{
	res.cookie('name',req.body.name);
	res.redirect('/');
});

io.on('connection', (socket) => {
  socket.emit('working', socket.id);
  console.log('user joined');
  socket.on('message', (msg) => {
    console.log(socket.id);
		let data = {
			name: socket.request.headers.cookie.name,
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
