const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema and model

const BusServiceSchema = new Schema({
  ServiceNo: String,
  Operator: String,
  Direction: Number,
  Category: String,
  OriginCode: String,
  DestinationCode: String,
  AM_Peak_Freq: String,
  AM_Offpeak_Freq: String,
  PM_Peak_Freq: String,
  PM_Offpeak_Freq: String,
  LoopDesc: String
});

const BusService = mongoose.model("busservice", BusServiceSchema);

module.exports = BusService;
