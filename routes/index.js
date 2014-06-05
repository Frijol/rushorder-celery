// Module dependencies
var request = require('request');
var rushorder = require('rushorder');

// Access tokens etc
var secrets = require('../secrets.js').secrets,
  celery = secrets.celery,
  ro = secrets.ro,
  plotly = secrets.plotly;

exports.index = function(req, res) {
  // Get data from Celery
  // getCelery(celery);
  // Get data from Rush Order
  getRushOrder(ro);
  // Graph with Plotly
  // Render the page
  res.render('index', { title: 'Express' });
};

function getCelery (celery) {
  request('https://api.trycelery.com/v1/orders?access_token=' + celery.token, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    } else {
      console.log(error, response.statusCode);
    }
  });
}

function getRushOrder (ro) {
  rushorder.getAPIKey(ro.username, ro.password, function (err, key) {
    rushorder.getInventory(key, function (err, inventory) {
      console.log(inventory);
    });
  });
}
