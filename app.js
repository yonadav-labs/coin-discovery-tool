
var express         = require('express');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var expressSession  = require('express-session');

var app             = express();
var server          = require('http').Server(app);

app.use(cookieParser());
app.use(expressSession({
    'secret': "SECRET",
    'cookie': {
        'maxAge': 3600*1000*24
    }}));
// app.use(expressSession({'secret': config.SECRET}));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/*', function(req, res, next) {
    // console.log(req.headers.host, req.url);
    // if(/^localhost.*/.test(req.headers.host)) {
    if(/^alt.*/.test(req.headers.host)) {
        res.redirect(req.protocol + '://www.' + req.headers.host + req.url, 301);
        // res.redirect(req.protocol + '://127.0.0.1:5000' + req.url, 301);
    } else {
        next();
    }
});

app.use('/', express.static(__dirname + '/src'));

server.listen(80);