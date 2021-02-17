exports.getDateTime = function(utcTimeZones) {
  let myDate = new Date();
  let myNow = Date.now();
  let myOffset = myDate.getTimezoneOffset();

  let timeZones = utcTimeZones.join();
  let timeZoneOffsets = [];
  let signRegex = /[+-]/g;
  let numRegex = /\d+/g;
  let signs = timeZones.match(signRegex);
  let times = timeZones.match(numRegex);

  for(let i=0,j=0; i<times.length; i=i+2) {
    let timeZoneOffset;
    let hr = parseInt(times[i]);
    let min = parseInt(times[i+1]);
    timeZoneOffset = (hr * 60) + min;
    if(signs[j++] == "-") {timeZoneOffset = -timeZoneOffset;}
    timeZoneOffsets.push(timeZoneOffset);
  }

  let theirDateTime = [];
  timeZoneOffsets.forEach(function(theirOffset) {
    let timeDiff = (theirOffset + myOffset) * 60 * 1000;
    let theirDate = new Date(myNow + timeDiff);
    //console.log(new Intl.DateTimeFormat('en-IN', {dateStyle: 'full'}).format(theirDate), theirDate.toLocaleTimeString());
    theirDateTime.push(new Intl.DateTimeFormat('en-IN', {dateStyle: 'full'}).format(theirDate) + "  " + theirDate.toLocaleTimeString());
  });
  return theirDateTime;
}
