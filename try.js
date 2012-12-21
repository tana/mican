function map(array, func) {
  var result = [];
  for (var i = 0; i < array.length; i++) {
    result.push(func(array[i]));
  }
  return result;
}

function filter(array, func) {
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (func(value)) {
      result.push(array[i]);
    }
  }
  return result;
}

function reduce(array, first, func) {
  var result = first;
  for (var i = 0; i < array.length; i++) {
    result = func(result, array[i]);
  }
  return result;
}

function mergeObject(a, b) {
  var newobj = {};
  for (var i in a) {
    newobj[i] = a[i];
  }
  for (var i in b) {
    newobj[i] = b[i];
  }
  return newobj;
}
function $_makeSuper(parent) {
var self = this;
  var result = function() { parent.apply(self, arguments); };
  p = parent.prototype;
  for (var i in p) {
    if (p[i] instanceof Function) {
      result[i] = function() { return p[i].apply(self, arguments); }
    }
  }
  return result;
}
var compiler = (require)("compiler");
var stdlib = "function map(array, func) {\n  var result = [];\n  for (var i = 0; i < array.length; i++) {\n    result.push(func(array[i]));\n  }\n  return result;\n}\n\nfunction filter(array, func) {\n  var result = [];\n  for (var i = 0; i < array.length; i++) {\n    var value = array[i];\n    if (func(value)) {\n      result.push(array[i]);\n    }\n  }\n  return result;\n}\n\nfunction reduce(array, first, func) {\n  var result = first;\n  for (var i = 0; i < array.length; i++) {\n    result = func(result, array[i]);\n  }\n  return result;\n}\n\nfunction mergeObject(a, b) {\n  var newobj = {};\n  for (var i in a) {\n    newobj[i] = a[i];\n  }\n  for (var i in b) {\n    newobj[i] = b[i];\n  }\n  return newobj;\n}";
var trylib = "\nfunction puts(str) {\n  document.getElementById(\"output\").value += str + \"\\n\";\n}\n";
function execute(code){
var output = ((document).getElementById)("output");
return (function() {try {
var js = stdlib + "\n" + trylib + "\n" + ((compiler).compileCode)(code);
var result = (eval)(js);
$$result$$ = (output).value = (output).value + "=> " + ((JSON).stringify)(result) + "\n";
} catch (e) {$$result$$ = (output).value = (output).value + "Error: " + (e).message + "\n";
}})();

}
;
$$result$$ = ((window).addEventListener)("load", (function(){
return ((((document).getElementById)("run")).addEventListener)("click", (function(){
var codearea = ((document).getElementById)("code");
return (execute)((codearea).value);


}));


}));
