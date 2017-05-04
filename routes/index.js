var express = require('express');
var router = express.Router();
var Postaus = require('../app/models/postaus');
var http = require('http');


var isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

module.exports = function(passport) {
	/* GET login page. */
	router.get('/', function(req, res, next) {
	  res.render('index', { message: req.flash('message') });
	 
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true 
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true 
	}));
	
	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	/* Get Threads */
	router.get('/threads', isAuthenticated,function(req, res) {
		Postaus.find({}).exec(function(err, result) {
			if (!err) {
				res.render('threads', { user: req.user, threads: result });
			}
		});
	});

	/* Handle Thread POST */
	router.post('/threads', isAuthenticated, function(req,res) {
		var newPost = new Postaus();
		newPost.creator = req.user.username;
        newPost.title = req.param('title');
        newPost.message = req.param('text');
        newPost.created = new Date();
        newPost.edited = "";

        newPost.save(function(err) {
			if (err) {
				console.log("Error in saving Postaus: "+err);
				throw err;
			}
			console.log('Adding thread succesful');
			res.redirect('/threads');
		})
		
	});

	router.get('/reseptit', function(req,res) {
		res.render('reseptit', {user: req.user});
	});


	router.get('/drawthread/:threadid', isAuthenticated, function(req,res) {
		console.log(threadid);
		var threadid = req.params.threadid;
		var req = http.get("http://localhost:3000/api/threads/"+threadid, function(rs) {
			var bodyChunks = [];
			rs.on('data', function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
			
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				var bodyJSON = JSON.parse(body);
				res.render('singlethread', {user: req.user, thread: bodyJSON});
		  })		
		}).end();
	});

	router.get('/editthread/:threadid', isAuthenticated, function(req,res) {
		var threadid = req.params.threadid;
		var req = http.get("http://localhost:3000/api/threads/"+threadid, function(rs) {
			var bodyChunks = [];
			rs.on('data', function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
			
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				var bodyJSON = JSON.parse(body);
				res.render('editthread', {user: req.user, thread: bodyJSON});
		  })		
		}).end();
	});

	router.get('/deletethread/:threadid', isAuthenticated, function(req,res) {
		Postaus.remove({_id: req.params.threadid}, function(err, result) {
			if (err) {
				throw err;
			}
			//res.json({message: "Delete succeeded"});
			res.redirect('/threads');
		})
		/*
		var options = {
			host: 'localhost',
			port: '3000',
			path: 'api/threads/'+req.params.threadid,
			method: 'DELETE'
		};
		console.log("tähän asti ennen requestii");
		var req = http.request(options, function(rs) {
			console.log("requesti sisäs");
			var responseString = "";
			rs.on('data', function(chunk) {
				responseString += (chunk);
			
			}).on('end', function() {
				console.log(responseString);
		  	})
		});
		req.write("tesmi");
		req.end();
		res.redirect('/threads');
		*/
	});

	router.route('/api/threads/:threadid')
		.get(getThread, isAuthenticated)
		.post(updateThread,isAuthenticated);
	
	router.route('/recipes')
		.post(searchRecipe, isAuthenticated);
	router.route('/recipes/:recipe_id')
		.get(getRecipeInfo,isAuthenticated);
		

	function getThread(req,res) {
		var thread = req.params.threadid;
		console.log(thread);
		Postaus.findById(thread, function(err, result) {
			if (err) {
				console.log(err);
				throw err;
			}
			console.log(result);
			res.json(result);
		});
	};

	function updateThread(req,res) {
		var thread = req.params.threadid;
		console.log(thread);
		Postaus.findById(thread, function(err, postaus) {
			if (err) {
				console.log(err);
				throw err;
			}
			
			postaus.message = req.param('text');
			postaus.edited = new Date();

			postaus.save(function(err) {
				if (err) {
					console.log("Error in updating thread: "+err);
					throw err;
				}
				console.log('Editing thread succesful');
				res.redirect('/drawthread/'+thread);
			})
		});
	};
	function searchRecipe(req, res) {
	
		var words = req.body.words.split(" ");
		var wordstring = "";
		for (i=0; i<words.length; i++) {
			if (i==words.length-1) {
				wordstring = wordstring + words[i];
			}
			else if (words.length > 1) {
				wordstring = wordstring + words[i] + "%20"
			}
		}
		console.log(wordstring);
		var querystring = 'http://food2fork.com/api/search?key=1ad88683508e22706a6d24a539a87768&q='+wordstring;
		var req = http.get(querystring, function(rs) {
			var bodyChunks = [];
			rs.on('data', function (chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				var bodyJSON = JSON.parse(body);
				console.log(bodyJSON);
				res.render('recipes', {recipe:bodyJSON.recipes});
				res.end();
				return;
			})
		});
		req.on('error', function(e) {
			console.log('ERROR: '+ e.message);
		});
		req.end();
	};
	function getRecipeInfo(req, res) {
		var id = req.params.recipe_id;
		console.log(id);
		var querystring = 'http://food2fork.com/api/get?key=1ad88683508e22706a6d24a539a87768&rId='+id;
		var req = http.get(querystring, function(rs) {
			var bodyChunks = [];
			rs.on('data', function (chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				var bodyJSON = JSON.parse(body);
				console.log(bodyJSON);
				res.render('recipe', {recipe:bodyJSON.recipe});
				res.end();
				return;
			})
		});
		req.on('error', function(e) {
			console.log('ERROR: '+ e.message);
		});
		req.end();
	};

	return router;
}


