// インデントをカッコに変換する
// convertを通す前にコメントは削除しておく
function chars(ch, num) {
  var result = "";
  for (var i = 0; i < num; i++) {
    result += ch;
  }
  return result;
}
function chomp(str) {
  var index = str.search(/\n+$/);
  if (index != -1) return str.substr(0, index);
  else return str;
}
function removeEmptyLines(str) {
  var lines = str.split(/\n|\r\n/);
  var result = "";
  for (var i = 0; i < lines.length; i++) {
    if (chomp(lines[i]) != "") result += lines[i] + "\n";
  }
  return result;
}
function convert(code) {
  var lines = code.split(/\n|\r\n/);
  var output = "";
  var firstIndents = lines[0].match(/^\s*/)[0].length;
  var stack = [firstIndents];
  var isLineStart = false;
  var lastStart = "";
  var blockIndex = 0;
  var barIndex = 0;
  var noPrint = false;
  for (var i = 0; i < lines.length; i++) {
    var indents = lines[i].match(/^\s*/)[0].length;
    if (isLineStart) {
      isLineStart = false;
      if (indents > stack[stack.length - 1]) {
        stack.push(indents);
        if (lastStart == ":") {
          output += lines[i - 1].substr(0, lines[i - 1].length - 1) + " {" + "\n";
        } else if (lastStart = "|") {
          output += lines[i - 1].substr(0, blockIndex) + " {"
                  + lines[i - 1].substr(barIndex) + "\n";
        }
      }
    } else {
      isNextStart = false;
      if (indents < stack[stack.length - 1]) {
        while (stack[stack.length - 1] > indents) {
          stack.pop();
          output += chars(" ", stack[stack.length - 1]) + "}" + "\n";
        }
      }
    }
    if (lines[i].substr(-1, 1) == ":") {
      isLineStart = true;
      lastStart = ":";
      noPrint = true;
    }
    var res = startWithBlock(lines[i]);
    if (res) {
      isLineStart = true;
      lastStart = "|";
      blockIndex = res[0];
      barIndex = res[1];
      noPrint = true;
    }
    if (!noPrint) output += lines[i] + "\n";
    noPrint = false;
  }
  while (stack[stack.length - 1] > 0) {
    stack.pop();
    output += chars(" ", stack[stack.length - 1]) + "}" + "\n";
  }
  return chomp(removeEmptyLines(output));
}
function startWithBlock(line) {
  if (line.substr(-1, 1) == "|") {
    var barcount = 0;
    var lastbar = line.length;
    for (var i = line.length - 1; i >= 0; i--) {
      if (line.charAt(i) == "|") {
        barcount++;
        lastbar = i;
      } else if (line.charAt(i) == ":") {
        if (barcount % 2 == 0) {
          return [i, lastbar];
        }
      }
    }
  }
  return false;
}

exports.convert = convert;