const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema and model

const BusRouteSchema = new Schema({
  ServiceNo: String,
  Operator: String,
  Direction: Number,
  StopSequence: Number,
  BusStopCode: String,
  Distance: Number,
  WD_FirstBus: String,
  WD_LastBus: String,
  SAT_FirstBus: String,
  SAT_LastBus: String,
  SUN_FirstBus: String,
  SUN_LastBus: String,
  Description: String
});

const BusRoute = mongoose.model("busroute", BusRouteSchema);

module.exports = BusRoute;
