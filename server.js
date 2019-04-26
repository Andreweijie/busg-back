const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const BusStop = require("./models/busstop");
const BusRouteTest = require("./models/BusRouteTest");
const BusService = require("./models/busservice");
const request = require("request");
const async = require("async");

const port = 5000;

const areas = {
  Downtown: { code: 0 },
  Orchard: { code: 0 },
  Chinatown: { code: 0 },
  Bugis: { code: 0 },
  Lavender: { code: 0 },
  HarbourFront: { code: 1 },
  BukitMerah: { code: 1 },
  RiverValley: { code: 1 },
  Tanglin: { code: 1 },
  Holland: { code: 1 },
  Buona: { code: 1 },
  PasirPanjang: { code: 1 },
  Clementi: { code: 1 },
  WestCoast: { code: 1 },
  JurongEast: { code: 2 },
  JurongWest: { code: 2 },
  Tuas: { code: 2 },
  JalanBahar: { code: 3 },
  OldCCK: { code: 3 },
  BukitTimah: { code: 4 },
  Lornie: { code: 4 },
  BukitBatok: { code: 4 },
  UpperBukitTimah: { code: 4 },
  CCK: { code: 4 },
  BukitPanjang: { code: 4 },
  Kranji: { code: 4 },
  NeoTiew: { code: 4 },
  Woodlands: { code: 4 },
  Admiralty: { code: 4 },
  JB: { code: 4 },
  Moulmein: { code: 5 },
  ToaPayoh: { code: 5 },
  Bishan: { code: 5 },
  AMK: { code: 5 },
  Thomson: { code: 5 },
  Lentor: { code: 5 },
  Yishun: { code: 5 },
  Sembawang: { code: 5 },
  KallangBahru: { code: 6 },
  Serangoon: { code: 6 },
  Hougang: { code: 6 },
  Sengkang: { code: 6 },
  Punggol: { code: 6 },
  SeletarWest: { code: 6 },
  MacPherson: { code: 7 },
  Ubi: { code: 7 },
  KakiBukit: { code: 7 },
  Tampines: { code: 7 },
  PasirRis: { code: 7 },
  Kallang: { code: 8 },
  Geylang: { code: 8 },
  JooChiat: { code: 8 },
  TelokKurau: { code: 8 },
  Eunos: { code: 8 },
  Bedok: { code: 8 },
  BedokReservoir: { code: 8 },
  Simpang: { code: 8 },
  Mountbatten: { code: 9 },
  EastCoast: { code: 9 },
  UpperEC: { code: 9 },
  Simei: { code: 9 },
  Loyang: { code: 9 },
  Changi: { code: 9 }
};

app.use(bodyParser.json());

mongoose.connect(
  "mongodb+srv://andreweijie:cdmbcdmb1@busgprod-hylze.gcp.mongodb.net/busdata?retryWrites=true",
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

async function searchServiceNo(query, callback) {
  let searchResults = [];
  await BusService.find(
    { ServiceNo: new RegExp(query, "i"), Direction: 1 },
    "ServiceNo",
    (err, docs) => {
      docs
        .sort((e1, e2) => {
          return e1.ServiceNo.length - e2.ServiceNo.length;
        })
        .slice(0, 4)
        .map(f => {
          searchResults.push(f.ServiceNo);
        });
      callback(null, searchResults);
    }
  ).sort({ ServiceNo: 1 });
}

async function searchStopNumber(query, callback) {
  let searchResults = [];
  BusStop.find(
    {
      $or: [
        { Description: new RegExp(query, "i") },
        { BusStopCode: new RegExp(query, "i") }
      ]
    },
    "BusStopCode Description",
    (err, doc) => {
      doc.map(e => {
        let data = { stopCode: e.BusStopCode, description: e.Description };
        searchResults.push(data);
      });
      callback(
        null,
        searchResults.sort((e1, e2) => {
          return e1.length - e2.length;
        })
      );
    }
  ).limit(8);
}
mongoose.connection
  .once("open", () => {
    console.log("Connection has been made...");
  })
  .on("error", err => {
    console.log("Connection Error:", err);
  });

app.get("/api/busdata", (req, res) => {
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
        res.json(docs);
      }
    }
  );
});

app.get("/api/nearby", (req, res) => {
  BusStop.find({}, "BusStopCode Latitude Longitude", (err, docs) => {
    if (err) {
      console.log(err);
    } else {
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
  async.parallel(
    [
      function(callback) {
        searchServiceNo(searchQ, callback);
      },
      function(callback) {
        searchStopNumber(searchQ, callback);
      }
    ],
    (err, results) => {
      console.log(results);
      res.json(results);
    }
  );
});

app.post("/api/busstopcoord", (req, res) => {
  console.log(req.url);
  console.log(req.body);
  let stopArray = req.body;
  stopCoords = [];
  async.map(
    stopArray,
    async item => {
      let data = [];
      await BusStop.find(
        { BusStopCode: item.toString() },
        "Latitude Longitude",
        (err, docs) => {
          if (err) {
            console.log(err);
          } else {
            data = docs;
          }
        }
      );
      return data;
    },
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json(results);
      }
    }
  );
});

app.get("/api/routes", (req, res) => {
  BusRouteTest.find(
    { ServiceNo: req.query.serviceno },
    "BusStopCode Description Direction StopSequence",
    (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(docs);
        res.json(docs);
      }
    }
  ).sort({ StopSequence: 1 });
});
app.listen(port, () => console.log(`Server running on port ${port}`));
