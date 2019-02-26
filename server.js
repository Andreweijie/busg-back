const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const BusStop = require("./models/busstop");
const BusRouteTest = require("./models/BusRouteTest");
const BusService = require("./models/busservice");
const request = require("request");

const port = process.env.PORT || 8080;

app.use(bodyParser.json());

mongoose.connect(
  "mongodb://andreweijie:cdmbcdmb1@busgprod-shard-00-00-hylze.gcp.mongodb.net:27017,busgprod-shard-00-01-hylze.gcp.mongodb.net:27017,busgprod-shard-00-02-hylze.gcp.mongodb.net:27017/busdata?ssl=true&replicaSet=BUSGPROD-shard-0&authSource=admin&retryWrites=true",
  {
    useNewUrlParser: true
  }
);

let distance = (lat1, lon1, lat2, lon2) => {
  let R = 6371; // km (change this constant to get miles)
  let dLat = ((lat2 - lat1) * Math.PI) / 180;
  let dLon = ((lon2 - lon1) * Math.PI) / 180;
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return Math.round(d * 1000);
};

mongoose.connection
  .once("open", () => {
    console.log("Connection has been made...");
  })
  .on("error", err => {
    console.log("Connection Error:", err);
  });

app.get("/", (req, res) => {
  res.send("Hello from App Engine!");
});

app.get("/api/busdata", (req, res) => {
  console.log(req.url);
  console.log(req.query.buscode);
  var options = {
    method: "GET",
    url: "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2",
    qs: { BusStopCode: req.query.buscode },
    headers: {
      accept: "application/json",
      AccountKey: "xGVgRkvQRJK7Mr6RGYiLLQ=="
    }
  };
  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.json(JSON.parse(body));
  });
});

app.get("/api/busname", (req, res) => {
  BusStop.find(
    { BusStopCode: req.query.buscode },
    "Description",
    (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(req.url);
        res.json(docs);
        console.log("Document retrieved successfully");
      }
    }
  );
});

app.get("/api/nearby", (req, res) => {
  BusStop.find({}, "BusStopCode Latitude Longitude", (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      console.log(req.url);
      const userLat = req.query.userLat;
      const userLon = req.query.userLon;
      let resEnd = {};
      let nearbyArr = docs.filter(e => {
        return distance(userLat, userLon, e.Latitude, e.Longitude) < 400;
      });
      nearbyArr.map(e => {
        resEnd[e.BusStopCode] = distance(
          userLat,
          userLon,
          e.Latitude,
          e.Longitude
        );
      });
      res.json(resEnd);
    }
  });
});

app.get("/api/search", (req, res) => {
  let resData = [];
  let searchQ = req.query.searchQuery;
  BusService.find(
    { ServiceNo: new RegExp(searchQ, "i"), Direction: 1 },
    "ServiceNo",
    (err, docs) => {
      docs
        .sort((e1, e2) => {
          return e1.ServiceNo.length - e2.ServiceNo.length;
        })
        .slice(0, 4)
        .map(f => {
          resData.push(f.ServiceNo);
        });
      BusStop.find(
        { BusStopCode: new RegExp(searchQ, "i") },
        "BusStopCode",
        (err, doc) => {
          doc.map(e => {
            resData.push(e.BusStopCode);
          });
          res.json(
            resData.sort((e1, e2) => {
              return e1.length - e2.length;
            })
          );
        }
      ).limit(4);
    }
  ).sort({ ServiceNo: 1 });
});

app.get("/api/routes", (req, res) => {
  BusRouteTest.find(
    { ServiceNo: req.query.serviceno },
    "BusStopCode Description Direction",
    (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(docs);
        res.json(docs);
      }
    }
  );
});
app.listen(port, () => console.log(`Server running on port ${port}`));
