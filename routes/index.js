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
    var allOrders = celeryData.orders;
    getDates(allOrders);
    getOrderStats(allOrders, function (stats) {
      res.render('index', { title: 'Dashboard',
        total: stats.total,
        numPaid: stats.numPaid,
        numOpen: stats.numOpen,
        numFailed: stats.numFailed,
        numCancelled: stats.numCancelled,
        grandTotal: stats.grandTotal,
        paidTotal: stats.paidTotal,
        openTotal: stats.openTotal,
        failedTotal: stats.failedTotal,
        cancelledTotal: stats.cancelledTotal
      });
    });

    // Get data from Rush Order
    // getRushOrder(ro);
    // Graph with Plotly
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

function getDates (orders) {
  orders.forEach(function (order) {
    console.log(order.created_date);
  });
}

function getOrderStats (allOrders, callback) {
  sortByStatus(allOrders, function (orders) {
    var paid = orders.paid;
    var open = orders.open;
    var failed = orders.failed;
    var cancelled = orders.cancelled;
    totalAll([allOrders, paid, open, failed, cancelled], function (totals) {
      var grandTotal = totals[0];
      var paidTotal = totals[1];
      var openTotal = totals[2];
      var failedTotal = totals[3];
      var cancelledTotal = totals[4];
      callback({
        total: allOrders.length,
        numPaid: paid.length,
        numOpen: open.length,
        numFailed: failed.length,
        numCancelled: cancelled.length,
        grandTotal: grandTotal,
        paidTotal: paidTotal,
        openTotal: openTotal,
        failedTotal: failedTotal,
        cancelledTotal: cancelledTotal
      });
    });
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

function totalMoney (orders, callback) {
  var total = 0;
  var count = 0;
  orders.forEach(function (order) {
    total += (order.total / 100); // original is in pennies; convert to dollars
    count ++;
    if (count == orders.length) {
      callback(total.toFixed(2));
    }
  });
}

function totalAll (orderArrays, callback) {
  var totals = [];
  var count = 0;
  orderArrays.forEach(function (orderArray, index) {
    totalMoney(orderArray, function (total) {
      totals[index] = total;
    });
    count++;
    if(count == orderArrays.length) {
      callback(totals);
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
