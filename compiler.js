var mican = require('./mican');
var comment = require('./comment');
var indentconv = require('./indent');

function map_tohash(arr, func) {
  var result = {};
  for (var i = 0; i < arr.length; i++) {
    var ret = func(arr[i]);
    result[ret[0]] = ret[1];
  }
  return result;
}
function map(arr, func) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    result.push(func(arr[i]));
  }
  return result;
}
// 演算子の名前をJSでの名前に変換
function opname(op) {
  var opstr = op.slice(1, -1);
  var str = "";
  for (var i = 0; i < opstr.length; i++) {
    var ch = opstr.charAt(i);
    if (ch == "+") str += "pl";
    else if (ch == "-") str += "mn";
    else if (ch == "*") str += "ml";
    else if (ch == "/") str += "dv";
    else if (ch == "%") str += "pc";
    else if (ch == ">") str += "gt";
    else if (ch == "<") str += "lt";
    else if (ch == "=") str += "eq";
    else if (ch == "!") str += "ex";
    else if (ch == "|") str += "bb";
    else if (ch == "&") str += "ap";
    else if (ch == "~") str += "wd";
  }
  return str;
}
// 関数呼び出しにしない演算子の対応表
optable = {};
optable["$$_pl_$$"] = "+";
optable["$$_mn_$$"] = "-";
optable["$$_ml_$$"] = "*";
optable["$$_dv_$$"] = "/";
optable["$$_pc_$$"] = "%";
optable["$$_gt_$$"] = ">";
optable["$$_lt_$$"] = "<";
optable["$$_eqeq_$$"] = "===";
optable["$$_exeq_$$"] = "!==";
optable["$$_gteq_$$"] = ">=";
optable["$$_lteq_$$"] = "<=";
optable["$$_gtgt_$$"] = ">>";
optable["$$_ltlt_$$"] = "<<";
optable["$$_apap_$$"] = "&&";
optable["$$_bbbb_$$"] = "||";
optable["$$_ap_$$"] = "&";
optable["$$_bb_$$"] = "|";
unarytable = {};
unarytable["$$_pl_$$"] = "+";
unarytable["$$_mn_$$"] = "-";
unarytable["$$_ex_$$"] = "!";
unarytable["$$_wd_$$"] = "~";
var envstack = [{}];
function compile(tree, indent, local) {
  var result = [];
  if (tree[0] == "def") {
    var name = tree[1];
    var params = tree[2];
    var body = tree[3];
    result.push("function " + compile_ident(name, -1, true) + compile_params(params) + "{");
    if (search_vararg(params) != false) {
      result.push(vararg_code(params));
    }
    result.push(compile_exprs(body, indent + 2, true));
    result.push("}");
    var str;
    if (local) {
      str = "((function() { " + result.join(" ") + " })())";
    } else {
      str = result.join("\n") + "\n";
    }
    return str;
  } else if (tree[0] == "fun") {
    console.log(tree);
    var params = tree[1];
    var body = tree[2];
    console.log(params);
    var str = "(function" + compile_params(params) + "{\n";
    if (search_vararg(params) != false) {
      str += vararg_code(params) + "\n";
    }
    str += compile_exprs(body, indent + 2, true) + "\n";
    str += "\n})";
    return str;
  } else if (tree[0] == "var") {
    return compile_ident(tree[1]);
  } else if (tree[0] == "funcall") {
    var func = compile(tree[1], 0, true);
    if (func.substr(0, 3) == "$$_" && func.substr(-3) == "_$$" && optable.hasOwnProperty(func)) {
      if (tree[2].length == 2)
        return compile(tree[2][0], 0, true) + " " + optable[func] + " " + compile(tree[2][1], 0, true);
      else if (tree[2].length == 1)
        return unarytable[func] + "(" + compile(tree[2][0], 0, true) + ")";
    }
    var args = compile_args(tree[2]);
    return "(" + func + ")" + args;
  } else if (tree[0] == "funcallblk") {
    return compile(["funcall", tree[1],
                    tree[2].concat([["fun", tree[3], tree[4]]])], indent, local);
  } else if (tree[0] == "int") {
    return tree[1].toString();
  } else if (tree[0] == "assign") {
    var declare = "";
    if (!envstack[envstack.length - 1].hasOwnProperty(tree[1])) {
      if (!local) declare = "var ";
      envstack[envstack.length - 1][tree[1]] = "var";
    }
    return declare + compile_ident(tree[1]) + " = " + compile(tree[2], 0, true);
  } else if (tree[0] == "globalassign") {
    return compile_ident(tree[1]) + " = " + compile(tree[2], 0, true);
  } else if (tree[0] == "if") {
    var str = "if (" + compile(tree[1], 0, true) + ") {\n"
      + compile_exprs(tree[2], indent + 2, false) + "\n"
      + "}";
    if (local) {
      return "(function() { \nvar $$result$$;\n" + str + "\n return $$result$$;\n" + "})()";
    } else {
      return str;
    }
  } else if (tree[0] == "ifelse") {
    var str = "if (" + compile(tree[1], 0, true) + ") {\n"
      + compile_exprs(tree[2], indent + 2, false)
      + "} else {\n"
      + compile_exprs(tree[3], indent + 2, false)
      + "}";
    if (local) {
      return "(function() { var $$result$$;\n"
        + str
        + "return $$result$$;\n})()";
    } else {
      return str;
    }
  } else if (tree[0] == "paren") {
    envstack.push(envstack[envstack.length - 1]);
    var code = (compile(tree[1], 0, true));
    envstack.pop();
    return "(" + code + ")";
  } else if (tree[0] == "string") {
    return JSON.stringify(tree[1]);
  } else if (tree[0] == "while") {
    var body = "while (" + compile(tree[1], 0, true) + ") {\n"
             + compile_exprs(tree[2], indent + 2, false)
             + "}";
    if (local) {
      return "(function() {\n  var $$result$$;\n" + body + ";\n  return $$result$$;\n})()";
    } else {
      return body + "\n";
    }
  } else if (tree[0] == "for") {
    var str = "(function() {"
    str += "var $_array_$ = " + compile(tree[2], 0, true) + "\n";
    str += "var $_length_$ = $_array_$.length;\n";
    str += "var $result$;\n";
    str += "for (var $_i_$ = 0; $_i_$ < $_array_$.length; $_i_$++) {\n"
    str += "var " + compile_ident(tree[1]) + " = $_array_$[$_i_$];\n";
    str += compile_exprs(tree[3], indent + 2, false);
    str += "}\n";
    str += "\nreturn $$result$$;\n})();";
    return str;
  } else if (tree[0] == "array") {
    return compile_array(tree[1]);
  } else if (tree[0] == "hash") {
    return compile_hash(tree[1], tree[2]);
  } else if (tree[0] == "access") {
    return "(" + compile(tree[1]) + ")[" + compile(tree[2]) + "]";
  } else if (tree[0] == "property") {
    return "(" + compile(tree[1], 0, true) + ")." + compile_ident(tree[2]);
  } else if (tree[0] == "arrayassign") {
    return compile(tree[1], 0, true) + " = " + compile(tree[2], 0, true);
  } else if (tree[0] == "objassign") {
    return compile(tree[1], 0, true) + " = " + compile(tree[2], 0, true);
  } else if (tree[0] == "arrcomp") {
    var expr = tree[1];
    var sources = tree[2];
    envstack.push(envstack[envstack.length - 1]);
    var str = "(function() {\n" + "  var arr = [];\n";
    str += "  var sources = " + "[" + map(sources, function(a) {
      return compile(a[1], 0, true);
    }).join(", ") + "]" + ";\n";
    str += "  var i = 0;\n";
    str += "  compbase: while (true) {\n";
    str += "    var endflag = false;\n";
    str += "    for (var j = 0; j < sources.length; j++) {\n";
    str += "      endflag = !(i < sources[j].length);\n";
    str += "    }\n";
    str += "    if (endflag) break;\n";
    for (var i = 0; i < sources.length; i++) {
      var code = ["assign", sources[i][0], ["access", sources[i][1], ["var", "i"]]];
      str += "    " + compile(code, indent + 6, false) + ";\n";
    }
    str += "    i++;\n";
    if (tree[3] != null) {
      str += "    if (!(" + compile(tree[3], 0, true) + ")) continue compbase;\n"
    }
    str += "    arr.push(" + compile(expr, 0, true) + ");\n";
    str += "  }\n";
    str += "  return arr;\n";
    str += "})()"
    envstack.pop();
    return str;
  } else if (tree[0] == "break") {
    return "break"
  } else if (tree[0] == "continue") {
    return "continue"
  } else if (tree[0] == "return") {
    if (tree.length == 2) return "return " + compile(tree[1], 0, true)
    else return "return"
  } else if (tree[0] == "trycatch") {
    var start = "";
    var end = "";
    if (local) {
      start = "(function() {";
      end = "})";
    }
    var str = "try {\n";
    str += compile_exprs(tree[1], indent + 2, false);
    str += "}";
    for (var i = 0; i < tree[2].length; i++) {
      envstack.push(envstack[envstack.length - 1]);
      if (tree[2][i][0] == null) {
        str += " catch {";
      } else {
        envstack[envstack.length - 1][tree[2][i][0]] = "var";
        str += " catch (" + compile_ident(tree[2][i][0]) + ") {";
      }
      str += compile_exprs(tree[2][i][1], indent + 2, false);
      envstack.pop();
      str += "}";
    }
    if (tree.length == 4) {
      str += " finally {\n";
      str += compile_exprs(tree[3], indent + 2, false);
      str += "}"
    }
    return start + str + end;
  } else if (tree[0] == "class") {
    var exprs = tree[3];
    var constructor = exprs.filter(function(a) { return a[1] == "new"; });
    var parent = tree[2];
    var name = compile_ident(tree[1]);
    envstack.push(envstack[envstack.length - 1]);
    var str = "";
    var ctor_str;
    if (constructor.length == 0){
      if (parent != null) {
        ctor_str = "function() { this.$_super_$ = $_makeSuper("
                 + compile(parent, 0, true) + "); }";
      } else {
        ctor_str = "function() {}";
      }
    } else {
      var ctor_func = ["fun", constructor[0][2], constructor[0][3]];
      ctor_str = "function () {";
      if (parent != null) {
        ctor_str += "\nthis.$_super_$ = $_makeSuper("
                  + compile(parent, 0, true) + ");\n";
      }
      ctor_str += compile(ctor_func, indent + 2, true);
      ctor_str += ".apply(this, arguments); }";
    }
    str += "var " + name + " = " + ctor_str + "\n";
    if (parent != null) {
      str += name + ".prototype = ";
      str += "new ((function () { var o = function() {}; o.prototype = " + compile(parent, 0, true);
      str += ".prototype; return o; })())();\n";
    }
    str += compile_class_exprs(exprs, name, indent);
    envstack.pop();
    if (local) return "(function () {" + str + "; return " + name + ";})()";
    else return str;
  } else if (tree[0] == "new") {
    return "new (" + compile(tree[1], 0, true) + ")" + compile_args(tree[2]);
  }
}
function compile_ident(ident) {
  if (ident.charAt(0) == "(" && ident.charAt(ident.length - 1) == ")") {
    return "$$_" + opname(ident) + "_$$";
  } else if (ident === "super") {
    return "this.$_super_$";
  } else {
    return ident;
  }
}
function search_vararg(params) {
  var result = false;
  for (var i = 0; i < params.length; i++) {
    if (params[i].charAt(0) == "*") {
      result = params[i];
    }
  }
  return result;
}
function vararg_code(params) {
  var vararg = search_vararg(params);
  var result = "";
  if (vararg != false) {
    var i;
    for (i = 0; i < params.length; i++) {
      if (params[i].charAt(0) == "*") break;
    }
    var name = vararg.slice(1);
    result = "var " + compile_ident(name) + " = "
           + "Array.prototype.slice.call(arguments, " + i.toString() + ");\n";
  }
  return result;
}
function compile_params(params) {
  var str = "(";
  for (var i = 0; i < params.length; i++) {
    if (params[i].charAt(0) != "*") {
      str += compile_ident(params[i]);
      if (i != params.length - 1) str += ", ";
    } else {
      str = str.slice(0, -2);
    }
  }
  return str + ")";
}
function compile_exprs(exprs, indent, isfunc) {
  var str = "";
  envstack.push(envstack[envstack.length - 1]);
  for (var i = 0; i < exprs.length; i++) {
    if (i == exprs.length - 1 && exprs[i][0] != "break" && exprs[i][0] != "continue") {
      if (isfunc || exprs[i][0] == "break" || exprs[i][0] == "return" || exprs[i][0] == "continue") {
        str += "return " + compile(exprs[i], 0, true) + ";\n";
      } else {
        str += "$$result$$ = " + compile(exprs[i], 0, true) + ";\n";
      }
    } else {
      str += compile(exprs[i], indent, false) + ";\n";
    }
  }
  envstack.pop();
  return str;
}
function compile_class_exprs(exprs, classname, indent) {
  var str = "";
  for (var i = 0; i < exprs.length; i++) {
    if (exprs[i][0] == "def") {
      if (exprs[i][1] != "new") {
        var newtree = ["fun", exprs[i][2], exprs[i][3]];
        var name = compile_ident(classname) + ".prototype." + compile_ident(exprs[i][1]);
        str += name + " = " + compile(newtree, indent + 2, true);
      }
    } else {
      str += compile(exprs[i], indent, false);
    }
    str += ";\n";
  }
  return str;
}
function compile_args(args) {
  var str = "(";
  for (var i = 0; i < args.length; i++) {
    str += compile(args[i], 0, true);
    if (i != args.length - 1) str += ", ";
  }
  return str + ")";
}
function compile_array(arr) {
  var str = "[";
  for (var i = 0; i < arr.length; i++) {
    str += compile(arr[i], 0, true);
    if (i != arr.length - 1) str += ", ";
  }
  return str + "]";
}
function compile_hash(keys, hash) {
  // memo: Javascriptのハッシュのキーは文字列化されたものが使われるらしい
  //       キーの復元用のハッシュを作って対処した。
  var str = "(function() { var h = new Array();\n";
  for (var i in hash) {
    str += "h[" + compile(keys[i], 0, true) + "] = " + compile(hash[i], 0, true) + ";\n"
  }
  return str + "return h;})()";
}
function compile_source(source) {
  return compile_exprs(source, 0, false);
}

var internal = "\
function $_makeSuper(parent) {\n\
var self = this;\n\
  var result = function() { parent.apply(self, arguments); };\n\
  p = parent.prototype;\n\
  for (var i in p) {\n\
    if (p[i] instanceof Function) {\n\
      result[i] = function() { return p[i].apply(self, arguments); }\n\
    }\n\
  }\n\
  return result;\n\
}\n\
"
function compileCode(src) {
  return internal + compile_source(mican.parse(indentconv.convert(comment.parse(src))));
}

exports.compileCode = compileCode;