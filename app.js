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
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
})); 

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/create', function (req, res) {
    res.render('create', { num: -1 });
});

app.post('/create', function (req, res) {
    console.log(newId);
    console.log(req.body);
    posted[newId] = JSON.stringify(req.body);
    io.emit('add', { [ newId.toString() ]: req.body.title } );
    sql.query('INSERT INTO contents (content, id) VALUES (' + sql.escape(JSON.stringify(req.body)) + ', ' + newId.toString() + ');');
    newId++;
    return res.redirect('/');
});

app.get('/createraw', function (req, res) {
    res.render('createraw', { num: -1 });
});

app.post('/createraw', function (req, res) {
    posted[newId] = req.body.content;
    io.emit('add', { [ newId.toString() ]: JSON.parse(req.body.content).title } );
    sql.query('INSERT INTO contents (content, id) VALUES (' + sql.escape(req.body.content) + ', ' + newId.toString() + ');');
    newId++;
    return res.redirect('/');
});

app.post('/view/:num/delete', function (req, res) {
    delete posted[req.params.num];
    sql.query('DELETE FROM contents WHERE id = ' + sql.escape(req.params.num).toString());
    return res.redirect('/');
});

app.get('/view/:num', function (req, res) {
    res.render('data', { content: JSON.parse(posted[req.params.num]), num: req.params.num });
});

app.get('/edit/:num', function (req, res) {
    res.render('create', { content: JSON.parse(posted[req.params.num]), num: req.params.num });
});

app.post('/edit/:num', function (req, res) {
    posted[req.params.num] = JSON.stringify(req.body);
    io.emit('add', { [ req.params.num.toString() ]: req.body.title } );
    sql.query('UPDATE contents SET content = ' + sql.escape(JSON.stringify(req.body)) + ' WHERE id = ' + req.params.num.toString() + ';');
    return res.redirect('/view/' + req.params.num);
});

app.get('/rawedit/:num', function (req, res) {
    res.render('createraw', { content: JSON.parse(posted[req.params.num]), num: req.params.num });
});

app.post('/rawedit/:num', function (req, res) {
    posted[req.params.num] = req.body.content;
    io.emit('add', { [ req.params.num.toString() ]: JSON.parse(req.body.content).title } );
    sql.query('UPDATE contents SET content = ' + sql.escape(req.body.content) + ' WHERE id = ' + req.params.num.toString() + ';');
    return res.redirect('/view/' + req.params.num);
});

app.get('/raw/:num', function (req, res) {
    res.render('raw', { content: JSON.parse(posted[req.params.num]) });
});

app.get('*', function (req, res) {
    res.render('error');
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
    var pst = {};
    for (const [index, post] of Object.entries(posted))  pst[index] = JSON.parse(post).title;
    io.to(socket.id).emit('add', pst);
});