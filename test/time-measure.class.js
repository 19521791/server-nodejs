const axios = require('axios');

class TimeMeasurement {
    constructor() {
      this.startTime = null;
      this.measurements = {};
    }
  
    start(key, method, url, data) {
      this.measurements[key] = {
        method,
        url,
        data,
        startTime: process.hrtime(),
        endTime: null,
      };
    }
  
    end(key) {
      if (this.measurements[key]) {
        this.measurements[key].endTime = process.hrtime(this.measurements[key].startTime);
        this.logTime(key);
      }
    }
  
    logTime(key) {
      const measurement = this.measurements[key];
      const seconds = measurement.endTime[0];
      const milliseconds = measurement.endTime[1] / 1000000;
      const totalTime = seconds + milliseconds / 1000;
      console.log(`[${key}] Time: ${totalTime.toFixed(3)} seconds`);
    }
  }
  
  module.exports = TimeMeasurement;
  