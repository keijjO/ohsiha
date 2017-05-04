var LocalStrategy   = require('passport-local').Strategy;
var User = require('../../app/models/user');
var Postaus = require('../../app/models/postaus');

module.exports = function(passport){

	passport.use('addPost', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, done) {
        	findOrCreatePost = function() {
        		console.log("paastiin postaus funkkariin!");
        		var newPost = new Postaus();
        		newPost.creator = username;
        		newPost.title = req.param('title');
        		newPost.message = req.param('text');
        		newPost.created = new Date();
        		newPost.edited = "";
				console.log("uus alustettu");
        		newPost.save(function(err) {
        			if (err) {
        				console.log("Error in saving Postaus: "+err);
        				throw err;
        			}
        			console.log('Adding thread succesful');
        			return done(null, newPost);
        		})
        	};
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreatePost);
        })
    );

}