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