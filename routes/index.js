var express = require('express');
var router = express.Router();
var passport = require('passport');
var moment = require('moment');

// TEMPORARY: probably not the best practice to place this directly in routes?
var mysql = require('mysql');
function getConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/lobby');
  } else {
    res.render(
      'index', 
      {
        title: 'Index'
      }
    );
  }
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render(
      'login',
      {
        title: 'Login'
      }
    );
  } else {
    res.redirect('/');
  }
});

/* POST login page. */
router.post('/login', function(req, res, next){

  const username = req.body.username;
  const password = req.body.password;

  console.log();
  console.log('From /login');
  console.log(username);
  console.log(password);
  console.log();

  var queryString = 'SELECT `uid`, `username` FROM user WHERE username LIKE \'';
  queryString = queryString + username + "' AND password LIKE '";
  queryString = queryString + password + "';";

  var connection = getConnection();
  connection.query(queryString, (err, rows, fields) => {
    if (err || !rows.length) {
      console.log("Failed to match user info: " + err + "\n");
      res.redirect('/login');
      return;
    }

    console.log("User info found! Login successful!\n");

    // USAGE FOR USER INFO:
    // user_info = {"uid":1, "username":"bob123"}
    // access uid like this: user_info.uid
    // access username like this: user_info.username
    const user_info = rows[0];
    console.log('\nLogin query result: ' + JSON.stringify(user_info) + '\n'); // test print

    // pass user_info as object req.user
    req.login(user_info, function(err){
      res.redirect('/lobby');
    });
  });
  connection.end();

});

passport.serializeUser(function(user_info, done) {
  done(null, user_info);
});
passport.deserializeUser(function(user_info, done) {
  done(null, user_info);
});

/* GET logout page. */
router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/'); // logout user is redirected to homepage  
});
/* GET register page. */
router.get('/register', function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.render(
      'register',
      {
        title: 'Register'
      }
    );
  } else {
    res.redirect('/');
  }
});

/* POST register page. */
router.post('/register', function(req, res, next) {

  const username = req.body.username;
  const password = req.body.password;

  // check username and password undefined
  if (username == undefined && password == undefined) {
    res.render (
      'register',
      {
        title: 'Register'
      }
    );
  }

  console.log();
  console.log(username);
  console.log(password);
  console.log();

  var queryString = 'INSERT INTO user (`username`, `password`) VALUES (?, ?);';

  var connection = getConnection();
  connection.query(queryString,
                   [username, password],
                   (err, rows, fields) => {
    if (err) {
      console.log("Failed to insert user into database: " + err + "\n");
      res.render(
        'register', 
        {
          title: 'Register'
        }
      );
      return;
    }
    //TODO: Handle if the registered user already exists

    console.log("New user created! Registration successful!\n");
    res.redirect('/login');
  });
  connection.end();
});

/* GET lobby page. */
router.get('/lobby', function(req, res, next) {
  if (req.isAuthenticated()) {
    const username = req.user.username;

    // Get all games needing a player or in progress
    const queryString = "SELECT * FROM game WHERE is_active=0 OR is_active=1;";
    
    var connection = getConnection();
    connection.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log("Failed to get lobbies: " + err + "\n");
        // 401 Unauthorized
        res.status(401).send("Oops, Failed to get lobbies"); 
        return;
      }

      console.log("Lobbies count: " + rows.length + "\n");
      
      // Convert lobby creation time to relative time
      if (rows) {
        lobbies = rows;
        for (i = 0; i < rows.length; i++) {
          time = lobbies[i].creation_time;
          lobbies[i].creation_time = moment(time).subtract(7, 'hours').fromNow();
        }
      }
  
      res.render(
        'lobby',
        {
          title: 'Lobby',
          user: username,
          lobbies: lobbies.reverse(),
          uid: req.user.uid
        }
      );
    });
    connection.end();
  } else {
    res.redirect('/login');
  }
});

/* GET my lobbies page. */
router.get('/mylobbies', function(req, res, next) {
  if (req.isAuthenticated()) {
    const username = req.user.username;
    const userId = req.user.uid;

    // Get all games needing a player or in progress
    const queryString = "SELECT * FROM game WHERE (is_active=0 OR is_active=1) AND (uid_1=" + userId + " OR uid_2=" + userId + ");";
    
    var connection = getConnection();
    connection.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log("Failed to get lobbies: " + err + "\n");
        res.status(401).send("Failed to get lobbies: " + err);
        return;
      }

      console.log("Lobbies count: " + rows.length + "\n");

      // Convert lobby creation time to relative time
      let lobbies;
      if (rows) {
        lobbies = rows;
        for (i = 0; i < rows.length; i++) {
          time = lobbies[i].creation_time;
          lobbies[i].creation_time = moment(time).subtract(7, 'hours').fromNow();
        }
      }
  
      res.render(
        'user_lobby', 
        {
          title: 'Lobby', 
          user: username, 
          lobbies: lobbies.reverse(), 
          uid: req.user.uid
        }
      );
    });
    connection.end();
  } else {
    res.redirect('/login');
  }
});

/* GET create lobby page. */
router.get('/create_lobby', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.render(
      'create_lobby',
      {
        title: 'Create Lobby',
        user: req.user.username
      }
    );
  } else {
    res.redirect('/login');
  }
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.render(
      'about',
      {
        title: 'About',
        user: req.user.username
      }
    );
  } else {
    res.render(
      'about',
      {
        title: 'About'
      }
    );
  }
});

router.get('/message', function(req, res, next) {
  let connection = getConnection()
  let queryString = 'SELECT * FROM `message`';
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to update game state: " + err + "\n");
      // defines behavior/action for error
      res.status(401).send('Failed to update game state.');
      return;
    }

    // Convert timestamps to readable format
    for (i = 0; i < rows.length; i++) {
      time = rows[i].timestamp;
      rows[i].timestamp = moment(time).subtract(7, 'hours').format("M/DD/YY HH:mm");
    }

    res.send(rows)
  });
  connection.end();

});

router.post('/message', function(req, res, next) {
    if (req.isAuthenticated()) {
      let userId = req.user.username;
      let message = req.body.message;
      let connection = getConnection()
      let queryString = "INSERT INTO `message` (uid, gid, message) VALUES ('"+userId+"', '1111', '"+message+"')";
      connection.query(queryString, (err, rows, fields) => {
        if (err) {
          console.log("Failed to send message: " + err + "\n");
          res.status(500).send("Failed to send message.");
          return;
        }
        res.send(fields)
      });
      connection.end();
    } 
      else {
        alert("You must login to user this chat");
        res.redirect('../login');
      }
});

module.exports = router;
