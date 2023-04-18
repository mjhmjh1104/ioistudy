var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mysql = require('mysql');
var bodyParser = require('body-parser');

var sql = mysql.createConnection({
    host: '127.0.0.1',
    user: 'ioistudy',
    password: process.env.IOISTUDY_MYSQL_PASSWORD,
    database: 'ioistudy'
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
})); 

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/', function (req, res) {
    posted[newId] = req.body.content;
    io.emit('add', { newId: req.body.content } );
    sql.query('INSERT INTO contents (content, id) VALUES ("' + req.body.content + '", ' + newId.toString() + ');');
    newId++;
    return res.redirect('/');
});

app.post('/:num/delete', function (req, res) {
    delete posted[req.params.num];
    sql.query('DELETE FROM contents WHERE id = ' + req.params.num.toString());
    return res.redirect('/');
})

var port = 3000;
http.listen(port, function () {
    console.log('Server on');
});

var posted = {};
var newId = 0;

sql.query('CREATE TABLE IF NOT EXISTS contents (content TEXT, id INT);');

sql.query('SELECT content, id FROM contents;', (error, rows, fields) => {
    if (error) throw error;
    rows.forEach((item) => {
        posted[item.id] = item.content;
        if (item.id + 1 > newId) newId = item.id + 1;
    });
});

io.on('connection', function (socket) {
    console.log('User connection ', socket.id);
    io.to(socket.id).emit('add', posted);
});