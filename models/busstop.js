const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema and model

const BusStopSchema = new Schema({
  BusStopCode: String,
  RoadName: String,
  Description: String,
  Latitude: Number,
  Longitude: Number
});

const BusStop = mongoose.model("busstop", BusStopSchema);

module.exports = BusStop;
