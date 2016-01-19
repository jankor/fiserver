var OANDAAdapter = require('oanda-adapter');
var cfg = require("./config");
var timeseries = require("./timeseries");
var symbols = require("./symbols");
var periods = require("./periods");
var server = require('http').createServer();
var io = require('socket.io')(server);

var client = new OANDAAdapter({
    // 'live', 'practice' or 'sandbox'
    environment: cfg.oandaAdapter.environment,
    // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
    accessToken: cfg.oandaAdapter.accessToken,
    // Optional. Required only if evironment is 'sandbox'
    username: cfg.oandaAdapter.username
});
var accountId = cfg.oandaAdapter.accountId;

symbols.forEach(function(symbol){
  try {
    client.subscribePrice(accountId, symbol, function (tick) {
      console.log(tick);
        timeseries.update(tick);
        bodyChunk = tick;
    }, this);
  } catch (e) {
    console.log(e);
  }
})

periods.forEach(function(period){
    symbols.forEach(function(symbol){
        client.getCandles(symbol, 1000, period, function (error, bars) {
            timeseries.import(symbol, period, bars);
        });
    })
})

io.on('connection', function(socket){
  socket.emit('initInstruments', 'Some json');
  socket.on('disconnect', function(){});
  setInterval(function(){
    if (bodyChunk !== last) {
      socket.emit('update', bodyChunk);
      last = bodyChunk;
    }
  }, 0.001);
});

server.listen(3000);
