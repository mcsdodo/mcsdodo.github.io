var Data = (function () {
  var data;
  var fileNames = [
    "0039D482D61A_sendPos-matched-0.json",
    "0039D482D61A_sendPos-matched-1.json",
    "0039D48275E3_sendPos-matched-0.json",
    "0039D48275E3_sendPos-matched-1.json",
    "0039D48275E3_sendPos-matched-2.json",
    "0039D48275E3_sendPos-matched-3.json",
    "0039D48275E3_sendPos-matched-4.json",
    "0039D483691F_sendPos-matched-0.json",
    "0039D483691F_sendPos-matched-1.json",
    "0039D483691F_sendPos-matched-2.json",
    "0039D483691F_sendPos-matched-3.json",
    "0039D483691F_sendPos-matched-4.json",
  ]
  return {
    get: async function () {
      if (!data) {
        data = data || {};

        for (let index = 0; index < fileNames.length; index++) {
          let fileName = fileNames[index];
          if (fileName.endsWith(".json")) {
            let response = await fetch(`results/${fileName}`);
            let json = await response.json();
            data[fileName] = json;
          }
        }
      }
      return data;
    }
  }
})();