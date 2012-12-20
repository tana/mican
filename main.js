var compiler = require('./compiler');
var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);
var sources = [];
var nostdlib = false;
var showhelp = false;
for (var i = 0; i < args.length; i++) {
  if (args[i] == "-n" || args[i] == "--no-stdlib") {
    nostdlib = true;
  } else if (args[i] == "-h" || args[i] == "--help") {
    showhelp = true;
  } else {
    sources.push(args[i]);
  }
}
if (sources.length == 0 || showhelp) {
  console.log("Usage: mican [options] [arguments]");
  console.log("  -n    Don't add standard library");
  console.log("  -h    Show help message");
  process.exit();
}

var stdlib = fs.readFileSync(__dirname + "/stdlib.js");

for (var i = 0; i < sources.length; i++) {
  var name = sources[i];
  var src = fs.readFileSync(name).toString();
  var result = "";
  if (!nostdlib) result += stdlib + "\n";
  result += compiler.compileCode(src);
  var ext = path.extname(name);
  var resname = path.basename(name, ext);
  fs.writeFileSync(resname + ".js", result);
}
