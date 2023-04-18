var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'ioistudy',
    password: process.env.IOISTUDY_MYSQL_PASSWORD,
    database: 'ioistudy'
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var port = 3000;
http.listen(port, function () {
    console.log('Server on');
});

var count = 0;

connection.query('SELECT * FROM test', (error, rows, fields) => {
    if (error) throw error;
    count = rows[0].x;
});

io.on('connection', function (socket) {
    console.log('User connection ', socket.id);
    io.to(socket.id).emit('set count', count);
    socket.on('press count', function() {
        count++;
        connection.query('UPDATE test SET x = ' + count.toString());
        io.emit('set count', count);
    });
});
