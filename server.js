const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const BusStop = require("./models/busstop");
const BusRouteTest = require("./models/BusRouteTest");
const BusService = require("./models/busservice");
const request = require("request");
const async = require("async");
const cors = require("cors");
const { Expo } = require("./node_modules/expo-server-sdk");
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

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
        console.log(results);
        res.json(results);
      }
    }
  );
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

app.get("/api/singlestop", (req, res) => {
  BusStop.find(
    { BusStopCode: req.query.buscode },
    "Latitude Longitude",
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
    async.parallel(
      [
        function (callback) {
          searchServiceNo(searchQ, callback);
        },
        function (callback) {
          searchStopNumber(searchQ, callback);
        }
      ],
      (err, results) => {
        console.log(results);
        res.json(results);
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

app.post("/users/pushtoken", (req, res) => {
  // Create a new Expo SDK client
  let expo = new Expo();

  // Create the messages that you want to send to clents
  let messages = [];
  for (let pushToken of somePushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      sound: "default",
      body: "This is a test notification",
      data: { withSome: "data" }
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error);
      }
    }
  })();
});
app.listen(port, () => console.log(`Server running on port ${port}`));
