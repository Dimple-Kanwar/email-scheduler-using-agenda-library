// import express
let express = require("express");
// import body-parser
let parser = require("body-parser");
// Configuring the database
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// initialize the app
let app = express();
var moment = require('moment');
// configure parser to handle POST requests
app.use(parser.urlencoded({extended:true}));
app.use(parser.json());

// setup server port
var port = process.env.PORT || 8080;

// configure routes
require('./routes.js')(app);

app.listen(port,() => {
    console.log("Running server on port: " + port);
})

// send message for default api
app.get("/",(req,res)=>{
    res.send("Welcome to express server");
}) 

// Connecting to the database
mongoose.connect("mongodb://localhost:27017/agenda", {
    useNewUrlParser:true, 
    useUnifiedTopology: true,
    useFindAndModify: false
});

// configure resume scheduled jobs on server restart
mongoose.connection.on('open',function () {
    mongoose.connection.db.collection('emails', function (err, collection) {
        collection.updateMany({lockedAt: {$exists: true}, lastFinishedAt: {$exists: false}}, {
            $unset: {
                lockedAt: undefined,
                lastModifiedBy: undefined,
                lastRunAt: undefined
            }, $set: {nextRunAt: new Date()}
        }, {multi: true}, function (e, numUnlocked) {
            if (e)
                console.error(e);
            console.log(`Unlocked #{${numUnlocked.modifiedCount}} jobs.`);
            // console.log(new Date());
        });
    });
});
var date = moment(new Date());
date.tz("Asia/Kolkata");
console.log("date in mo: ", date.format())