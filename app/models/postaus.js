// app/models/postaus.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var postausSchema = mongoose.Schema({
    id:String,
    creator:String,
    title:String,
    message:String,
    created:String,
    edited:String
});

// create the model for post and expose it to our app
module.exports = mongoose.model('Postaus', postausSchema);