/**
 * Configuration for connection to database
 */

var express = require('express');
var app = express();
var router = express.Router();
// TEMPORARY: probably not the best practice to place this directly in routes?
var mysql = require('mysql');

/**
 * Establishes a connection to the database
 * @return mysql connection
 */
function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
}

// <oururl>.com/api is the base url for all our api routes
app.use(
  '/api',
  router
);

router.get('/lobby', function (req, res, next) {
  // TODO
  // - get json of: lobby number, player info, lobby status
});

module.exports = router;
