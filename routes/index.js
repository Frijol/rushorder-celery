// Module dependencies
var request = require('request');
var rushorder = require('rushorder');

// Access tokens etc
var secrets = require('../secrets.js').secrets,
  celery = secrets.celery,
  ro = secrets.ro,
  plotly = secrets.plotly;

exports.index = function (req, res) {
  // Get data from Celery
  getCelery(celery, function (err, celeryData) {
    var ordersRaw = celeryData.orders;
    var total = celeryData.total;
    sortByStatus(ordersRaw, function (orders) {
      var paid = orders.paid;
      var open = orders.open;
      var failed = orders.failed;
      var cancelled = orders.cancelled;
      res.render('index', { title: 'Dashboard',
        total: total,
        numPaid: paid.length,
        numOpen: open.length,
        numFailed: failed.length,
        numCancelled: cancelled.length
      });
    });
    // Get data from Rush Order
    // getRushOrder(ro);
    // Graph with Plotly
    // Render the page
  });
};

function getCelery (celery, callback) {
  request('https://api.trycelery.com/v1/orders?access_token=' + celery.token, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, JSON.parse(body));
    } else {
      callback([error, response.statusCode]);
    }
  });
}

function sortByStatus (orders, callback) {
  var paid = [];
  var open = [];
  var failed = [];
  var cancelled = [];
  orders.forEach(function (order) {
    // Sort
    if (order.status === 'paid_balance') {
      paid.push(order);
    } else if (order.status === 'open') {
      open.push(order);
    } else if (order.status === 'cancelled' || order.status === 'refunded_balance') {
      cancelled.push(order);
    } else if (order.status === 'charge_balance_failed') {
      failed.push(order);
    } else {
      console.log(order); // in case we're missing anything
    }
    // Callback
    if((paid.length + open.length + failed.length + cancelled.length) == orders.length) {
      callback({paid: paid, open: open, failed: failed, cancelled: cancelled});
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
