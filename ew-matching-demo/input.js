var Data = (function() {
  var data;
  var files = [7,1,2,3];
  var fileNames = files.map(n => n+".csv");
  return {
    get: async function() {
      if (!data){

        for (let index = 0; index < fileNames.length; index++) {
          const fileName = fileNames[index];
          let response = await fetch(fileName);
          let text = await response.text();
          let lines = text.split('\n');
          let ident = `ew-${files[index]}`;

          data = data || {};
          data[ident] = { coordinates: [], timestamps: [], speeds: []};

          for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let items = line.split(',');
            let timestamp = Number.parseInt(items[3]);
            let lat = Number.parseFloat(items[4]);
            let lng = Number.parseFloat(items[5]);
            let speed = Number.parseFloat(items[8]);
            if (timestamp && lat && lng && speed){
              data[ident].coordinates.push(`${lat},${lng}`);
              data[ident].timestamps.push(timestamp);
              data[ident].speeds.push(Math.round(speed));
            }
          }
        }
        console.log("Getting data");
      }
      return data;
    }
  }
})();