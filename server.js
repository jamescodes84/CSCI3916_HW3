/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');

//require('dotenv').config();


//const secretOrKey = process.env.SECRET_KEY;

var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
//db = require('./db')(); //hack
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {

        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        
        user.save(function(err) {
            if (err){
                if (err.code == 11000)
                    return res.json({success: false, message: 'A user with that username already exists'});
                else    
                    return res.json(err);
            }
            res.json({success: true, msg: 'Successfully created new user.'})
        });

        //db.save(newUser); //no duplicate checking
        
    }
});

router.post('/signin', (req, res) => {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function(err, user){
        if (err) {
            res.send(err);
        }
        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    });
});

// router.route('/testcollection')
//     .delete(authController.isAuthenticated, (req, res) => {
//         console.log(req.body);
//         res = res.status(200);
//         if (req.get('Content-Type')) {
//             res = res.type(req.get('Content-Type'));
//         }
//         var o = getJSONObjectForMovieRequirement(req);
//         res.json(o);
//     }
//     )
//     .put(authJwtController.isAuthenticated, (req, res) => {
//         console.log(req.body);
//         res = res.status(200);
//         if (req.get('Content-Type')) {
//             res = res.type(req.get('Content-Type'));
//         }
//         var o = getJSONObjectForMovieRequirement(req);
//         res.json(o);
//     }
//     );
//ChatGPT helped me with these last two routes, I had no idea what to do

    router.route('/movies')
    .get(authJwtController.isAuthenticated,(req, res) => {
        Movie.find(function(err, movies){
            if (err) {
                res.status(500).send(err);
            } 
            res.json(movies);
        })
        
    })
    .post(authJwtController.isAuthenticated,(req, res) => {
        // Implementation here
        let newMovie = new Movie();
        newMovie.title = req.body.title;
        newMovie.releaseDate = req.body.releaseDate;
        newMovie.genre= req.body.genre;
        newMovie.actors = req.body.actors;
        newMovie.save(function(err){
            if (err) {
                if (err.code == 11000) {
                    return res.status(400).json({
                        success: "False",
                        message: "Title already exists"
                    });
                }
                return res.status(500).send(err);
            }
            res.json({message:"Movie Created"});
        });
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        Movie.findOneAndUpdate(
            { title: req.body.title },
            req.body,
            { new: true, upsert: true },
            function(err, movie) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.json({ message: "Movie Updated", movie: movie });
            }
        );
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        Movie.findOneAndDelete({ title: req.body.title }, function(err, movie) {
            if (err) {
                return res.status(500).send(err);
            }
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: "Movie not found"
                });
            }
            res.json({ message: "Movie Deleted", movie: movie });
        });
    })
    .all((req, res) => {
        // Any other HTTP Method
        // Returns a message stating that the HTTP method is unsupported.
        res.status(405).send({ message: 'HTTP method not supported.' });
    });



// router.get('/movies', (req,res)=>{
//         res = { status: 200, message: "GET movies", headers: req.headers, query: req.query, env: UNIQUE_KEY };
//         res.status(200).send();
//     })
//     .post((req, res) => {
//         // Implementation here
//     })
//     .put(authJwtController.isAuthenticated, (req, res) => {
//         // HTTP PUT Method
//         // Requires JWT authentication.
//         // Returns a JSON object with status, message, headers, query, and env.
//         var o = getJSONObjectForMovieRequirement(req);
//         o.status = 200;
//         o.message = "movie updated";
//         res.json(o);
//     })
//     .delete(authController.isAuthenticated, (req, res) => {
//         // HTTP DELETE Method
//         // Requires Basic authentication.
//         // Returns a JSON object with status, message, headers, query, and env.
//         var o = getJSONObjectForMovieRequirement(req);
//         o.status = 200;
//         o.message = "movie deleted";
//         res.json(o);
//     })
//     .all((req, res) => {
//         // Any other HTTP Method
//         // Returns a message stating that the HTTP method is unsupported.
//         res.status(405).send({ message: 'HTTP method not supported.' });
//     });
app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


