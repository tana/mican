var compiler = require('./compiler');
var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);
var sources = [];
var nostdlib = false;
for (var i = 0; i < args.length; i++) {
  if (args[i] == "-n") {
    nostdlib = true;
  } else {
    sources.push(args[i]);
  }
}
if (sources.length == 0) {
  console.log("Usage: mican [options] [arguments]");
  console.log("  -n    Don't add standard library");
}

// main.js‚Æ“¯‚¶ƒpƒX‚É‚·‚é
var stdlib = fs.readFileSync(path.dirname(process.argv[1]) + "/stdlib.js");

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