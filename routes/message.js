/**
* Requests and responses for message route
*/
var express = require('express');
var router = express.Router();
var app = express();

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

app.use(
  '../message',
  router
);

module.exports = router;
