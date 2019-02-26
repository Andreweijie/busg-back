const mongoose = require("mongoose");
const BusRoute = require("./models/busroute");
const BusStop = require("./models/busstop");
const BusRouteTest = require("./models/BusRouteTest");
const request = require("request");

//ES6 Promises
mongoose.Promise = global.Promise;

//Connect to db before test run

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/busdata", {
  useNewUrlParser: true
});

mongoose.connection
  .once("open", () => {
    console.log("Connection has been made...");
  })
  .on("error", err => {
    console.log("Connection Error:", err);
  });

/*for (var i = 0; i < 50; i++, skip += 500) {
  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    BusRoute.insertMany(JSON.parse(body).value, docs => {
      console.log("Docs inserted successfully");
    });
  });
  setTimeout(() => {
    console.log(skip);
  }, 5000);
}*/

function start(counter) {
  if (counter < data1.length) {
    setTimeout(function() {
      BusRouteTest.updateMany(
        { BusStopCode: data1[counter].BusStopCode },
        { $set: { Description: data1[counter].Description } },
        { multi: true },
        err => {
          if (err) {
            console.log(err);
          } else {
            console.log("Updated!");
          }
        }
      );
      counter += 1;
      start(counter);
    }, 5000);
  }
}
start(0);
/*()
BusStop.find({}, "BusStopCode Description", (err, docs) => {
  if (err) {
    console.log(err);
  } else {
    docs.map(e => {
      BusRouteTest.updateOne(
        { BusStopCode: e.BusStopCode },
        { Description: e.Description }
      );
      console.log("modified");
    });
  }
});
BusRouteTest.updateMany(
  {},
  { $set: { Description: "test2" } },
  { multi: true },
  err => {
    if (err) {
      console.log(err);
    } else {
      console.log("Updated!");
    }
  }
);*/
