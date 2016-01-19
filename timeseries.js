var symbols = require("./symbols");
var periods = require("./periods");
var cfg = require("./config");

var symbolsObject = symbols.reduce(function(o, v, i) {
  o[v] = [];
  return o;
}, {});

var timeseries = {
  intervals: {
      M1: 60000,
      M5: 60000 * 5,
      M15: 60000 * 15,
      M30: 60000 * 30
  },

  db: {
    M1: symbolsObject,
    M5: symbolsObject,
    M15: symbolsObject,
    M30: symbolsObject,
    H1: symbolsObject,
    D: symbolsObject
  },

  loaded: false,

  import: function (symbol, period, bars) {
    this.pushTick(symbol, period, bars[bars.length-1]);
    for (i = bars.length-2; i >= 0; i--) {
      var latestBar = this.db[period][symbol][this.db[period][symbol].length-1];
      if ((latestBar.time - parseInt(bars[i].time)) == this.intervals[period]) {
          this.pushTick(symbol, period, bars[i]);
      } else {
        missingBars = (latestBar.time - parseInt(bars[i].time)) / this.intervals[period];
        for (n = 1; n <= missingBars; n++) {
          this.pushEmptyTick(
            symbol,
            period,
            latestBar,
            latestBar.time + parseInt(n * this.intervals[period])
           )
        }
        this.pushTick(symbol, period, bars[i]);
      };
    }
    this.db[period][symbol] = this.db[period][symbol].slice(0, cfg.bars);
  },

  unshiftEmptyTick: function (symbol, period, prevTick, time) {
    this.db[period][symbol].unshift(this.formatEmptyTick(prevTick, time));
  },

  pushEmptyTick: function (symbol, period, prevTick, time) {
    this.db[period][symbol].push(this.formatEmptyTick(prevTick, time));
  },

  pushTick: function (symbol, period, tick) {
      this.db[period][symbol].push(this.formatTick(tick));
  },

  update: function (tick) {
    var me = this;

    periods.forEach(function(period){
      symbols.forEach(function(symbol){
        if (me.db[period][symbol].length == cfg.bars) {
          var currentTime = new Date(tick.time).getTime();
          var lastBarTime = me.db[period][symbol][0].time;
          console.log(currentTime + " : " + lastBarTime);
          console.log(currentTime - lastBarTime);
          if ((currentTime - lastBarTime) > me.intervals[period]) {
            var newBarTime = lastBarTime + parseInt(me.intervals[period]);
            me.unshiftEmptyTick(symbol, period, me.db[period][symbol][0], newBarTime);
            me.db[period][symbol].pop();
          }
          if (tick.instrument == symbol) {
            me.updateCurrentBar(symbol, period, tick);
          }
        }
      })
    })
  },

  updateCurrentBar: function (symbol, period, tick) {
    var me = this;

    if (me.db[period][symbol][0].high < tick.ask) {
      me.db[period][symbol][0].high = tick.ask;
    }

    if (me.db[period][symbol][0].low > tick.ask) {
      me.db[period][symbol][0].low = tick.ask;
    }

    me.db[period][symbol][0].close = tick.ask;
  },

  formatTick: function (tick) {
    return ({
      open: tick.openAsk,
      close: tick.closeAsk,
      high: tick.highAsk,
      low: tick.lowAsk,
      time: (parseInt(tick.time) / 1000)
    });
  },

  formatEmptyTick: function (prevTick, time) {
    return ({
      open: prevTick.close,
      close: prevTick.close,
      high: prevTick.close,
      low: prevTick.close,
      time: parseInt(time)
    });
  }
}

module.exports = timeseries;
