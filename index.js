var OANDAAdapter = require('oanda-adapter');
var cfg = require("./config");
var timeseries = require("./timeseries");
var symbols = require("./symbols");
var periods = require("./periods");
var client = new OANDAAdapter({
    // 'live', 'practice' or 'sandbox'
    environment: cfg.oandaAdapter.environment,
    // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
    accessToken: cfg.oandaAdapter.accessToken,
    // Optional. Required only if evironment is 'sandbox'
    username: cfg.oandaAdapter.username
});
var accountId = cfg.oandaAdapter.environment.accountId;

symbols.forEach(function(symbol){
    client.subscribePrice(accountId, symbol, function (tick) {
        timeseries.update(tick);
        console.log(timeseries.db.M1.EUR_USD.length);
        if (timeseries.db.M1.EUR_USD.length > 0) {
          console.log(timeseries.db.M1.EUR_USD[0]);
        }
    }, this);
})

periods.forEach(function(period){
    symbols.forEach(function(symbol){
        client.getCandles(symbol, 1000, period, function (error, bars) {
            timeseries.import(symbol, period, bars);
        });
    })
})
