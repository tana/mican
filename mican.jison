/*
  Expression Parser
*/
%lex
%{
// Escape Sequences
esctable = {};
esctable["n"] = "\n";
esctable["t"] = "\t";
esctable["b"] = "\b";
esctable["v"] = "\v";
esctable["f"] = "\f";
esctable["r"] = "\r";
esctable["\'"] = "\'";
esctable["\\"] = "\\";
%}
%x string
%s comment
%s blcomment
%s heredoc
%%
/* comment */
<INITIAL>"//"    this.begin('comment');
<comment>[\n|\r\n]+   this.begin('INITIAL'); return 'NEWLINE'
<comment>[^\n]      /* skip */
/* nested block comment */
<INITIAL>"/*"   this.begin('blcomment'); commentcnt = 0;
<blcomment>"/*" commentcnt++;
<blcomment>"*/" commentcnt--; if (commentcnt < 0) this.begin('INITIAL');
<blcomment>.|\n|\r\n    /* skip */
/* here document */
<INITIAL>"\"\"\""       this.begin('heredoc'); herestr = "";
<heredoc>"\"\"\""       this.begin('INITIAL'); yytext = herestr; herestr = ""; return 'STRING'
<heredoc>.|\n|\r\n      herestr += yytext;
/* special */
<INITIAL>[ \t]+      /* skip */
\n+     return 'NEWLINE'
//"NEWLINE"   return 'NEWLINE'
';'         return ';'
/* reserved words */
"def"       return 'DEF'
"fun"       return 'FUN'
"if"        return 'IF'
"else"      return 'ELSE'
"then"      return 'THEN'
"->"        return '->'
"while"     return 'WHILE'
"<-"        return '<-'
"break"     return 'BREAK'
"continue"  return 'CONTINUE'
"return"    return 'RETURN'
"global"    return 'GLOBAL'
"try"       return 'TRY'
"catch"     return 'CATCH'
"finally"   return 'FINALLY'
"class"     return 'CLASS'
"extends"   return 'EXTENDS'
"new"       return 'NEW'
"for"       return 'FOR'
"in"        return 'IN'

/* if-else */
\}[ \t]*\n?[ \t]*else    return 'CLOSEELSE'
/* try-catch */
\}[ \t]*\n?[ \t]*catch    return 'CLOSECATCH'
/* block */
"{"         return '{'
"}"         return '}'
/* number */
[0-9]+              return 'DECIMAL'
0x[0-9a-fA-F]+      return 'HEX'
0b[01]+             return 'BINARY'
/* string */
//\"([^\"\n]|[\\\"])*\" return 'STRING'
<INITIAL>\"     { this.begin('string'); tmp = ""; esc = false; }
<string>\\      {
  if (esc) {
    tmp += "\\";
    esc = false;
  }
  else esc = true;
}
<string>[btnvfr\'\\]        {
  if (esc) {
    tmp += esctable[yytext];
    esc = false;
  } else {
    tmp += yytext;
  }
}
<string>[^\n\"btnvfr\'\\]   { tmp += yytext; }
<string>\"      { 
  if (esc) {
    tmp += "\""; esc = false;
  } else {
    this.begin('INITIAL'); yytext = tmp; tmp = ""; esc = false; return 'STRING'
  }
}
/* array */
'['         return '['
']'         return ']'
/* hash */
':'         return ':'
/* identifier */
[a-zA-Z_][0-9a-zA-Z_]*    return 'IDENT'
\([\+\-\*/%\>\<=\!@&\|\^\~\?]+\)    return 'IDENT'
/* operator */
\*\*        return 'BINOP1'
\*          return 'MULTIPLY'
[/%]        return 'BINOP2'
[\+\-]      return 'BINOP3'
\>\>|\<\<       return 'BINOP4'
[\>\<]|\>=|\<=  return 'BINOP5'
"=="|"!="      return 'BINOP6'
"&"|"^"        return 'BINOP7'
"|"         return 'VERTBAR'
"&&"|"||"     return 'BINOP8'
\!|\~|\?          return 'UNAOP1'
"="         return 'ASSIGN'
/* bracket */
"("     return '('
")"     return ')'
/* other */
","     return ','
"."     return '.'

/lex

%right ASSIGN
%nonassoc COMPREHENSION
%left BINOP8
%left BINOP7, VERTBAR
%left BINOP6
%left BINOP5
%left BINOP4
%left BINOP3
%left BINOP2 MULTIPLY
%left BINOP1
%nonassoc UNARY

%start main

%%
main
  : optexprs
    { return $1; }
  ;
expr
  : expr binop expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }
/*  | expr BINOP2 expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }
  | expr BINOP3 expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }
  | expr BINOP4 expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }
  | expr BINOP5 expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }
  | expr BINOP6 expr
    { $$ = ["funcall", ["var", "(" + $2 + ")"], [$1, $3]]; }*/
  | BINOP3 expr %prec UNARY
    { $$ = ["funcall", ["var", "(" + $1 + ")"], [$2]]; }
  | GLOBAL IDENT ASSIGN expr
    { $$ = ["globalassign", $2, $4]; }
  | IDENT ASSIGN expr
    { $$ = ["assign", $1, $3]; }
  | access ASSIGN expr
    { $$ = ["arrayassign", $1, $3]; }
  | property ASSIGN expr
    { $$ = ["objassign", $1, $3]; }
  | DEF IDENT params optnl '{' optnl optexprs '}'
    { $$ = ["def", $2, $3, $7]; }
  | DEF IDENT params '->' expr
    { $$ = ["def", $2, $3, [$5]]; }
  | FUN params optnl '{' optnl optexprs '}'
    { $$ = ["fun", $2, $6]; }
  | FUN params '->' expr
    { $$ = ["fun", $2, [$4]]; }
  | IF expr optnl '{' optnl optexprs '}'
    { $$ = ["if", $2, $6]; }
  | IF expr optnl '{' optnl optexprs CLOSEELSE optnl '{' optnl optexprs '}'
    { $$ = ["ifelse", $2, $6, $11]; }
  | IF expr THEN expr optnl ELSE expr
    { $$ = ["ifelse", $2, [$4], [$7]]; }
  | WHILE expr optnl '{' optnl optexprs '}'
    { $$ = ["while", $2, $6]; }
  | FOR IDENT IN expr optnl '{' optnl optexprs '}'
    { $$ = ["for", $2, $4, $8]; }
  | trycatch
  | BREAK
    { $$ = ["break"]; }
  | CONTINUE
    { $$ = ["continue"]; }
  | RETURN expr
    { $$ = ["return", $2]; }
  | RETURN
    { $$ = ["return"]; }
  | CLASS IDENT optnl '{' optnl optclassexprs '}'
    { $$ = ["class", $2, null, $6]; }
  | CLASS IDENT EXTENDS classname optnl '{' optnl optclassexprs '}'
    { $$ = ["class", $2, $4, $8]; }
  | funname
    { $$ = $1; }
  ;
optclassexprs
  :
    { $$ = []; }
  | classexprs
    { $$ = $1; }
  ;
classexprs
  : classexpr
    { $$ = [$1]; }
  | classexpr NEWLINE
    { $$ = [$1]; }
  | classexpr ';'
    { $$ = [$1]; }
  | classexpr NEWLINE classexprs
    { $$ = [$1].concat($3); }
  | classexpr ';' classexprs
    { $$ = [$1].concat($3); }
  | NEWLINE classexprs
    { $$ = $2; }
  | ';' NEWLINE classexprs
    { $$ = $3; }
  ;
classexpr
  : DEF NEW params optnl '{' optnl optexprs '}'
    { $$ = ["def", "new", $3, $7]; }
  | DEF NEW params '->' expr
    { $$ = ["def", "new", $3, [$5]]; }
  | expr
  ;
trycatch
  : TRY optnl '{' optnl optexprs catchfinally
    { $$ = ["trycatch", $5].concat($6); }
  ;
catchfinally
  : CLOSECATCH optnl '{' optnl optexprs '}'
    { $$ = [[[null, $5]]]; }
  | CLOSECATCH IDENT optnl '{' optnl optexprs '}'
    { $$ = [[[$2, $6]]]; }
  | CLOSECATCH optnl '{' optnl optexprs '}' catchfinally2
    { $$ = $7([[[null, $5]]]); }
  | CLOSECATCH IDENT optnl '{' optnl optexprs '}' catchfinally2
    { $$ = $8([[[$2, $6]]]); }
  ;
catchfinally2
  : FINALLY optnl '{' optnl optexprs '}'
    { $$ = function(arr) { return arr.concat([$5]); }; }
  | CATCH optnl '{' optnl optexprs '}'
    { $$ = function(arr) { return [arr[0].concat([[null, $5]])]; }; }
  | CATCH IDENT optnl '{' optnl optexprs '}'
    { $$ = function(arr) { return [arr[0].concat([[$2, $6]])]; }; }
  | CATCH optnl '{' optnl optexprs '}' catchfinally2
    { $$ = function(arr) { return $7([arr[0].concat([[null, $5]])]); }; }
  |  CATCH IDENT optnl '{' optnl optexprs '}' catchfinally2
    { $$ = function(arr) { return $8([arr[0].concat([[$2, $7]])]); }; }
  ;
// クラス名の部分に使用可能な式
classname
  : IDENT
    { $$ = ["var", $1]; }
  | STRING
    { $$ = ["string", $1]; }
  | array
    { $$ = ["array", $1]; }
  | hash
    { $$ = ["hash", $1[0], $1[1]]; }
  | arrcomp
    { $$ = ["arrcomp", $1[0], $1[1], $1[2]]; }
  | access
  | property
  | '(' expr ')'
    { $$ = ["paren", $2]; }
  ;
// 関数名の部分に使用可能な式
funname
  : classname
  | NEW classname args
    { $$ = ["new", $2, $3]; }
  | funname args
    { $$ = ["funcall", $1, $2]; }
  | funname args '{' optnl optexprs '}'
    { $$ = ["funcallblk", $1, $2, [], $5]; }
  | funname args '{' blockparams optnl optexprs '}'
    { $$ = ["funcallblk", $1, $2, $4, $6]; }
  | DECIMAL
    { $$ = ["int", parseInt($1, 10)]; }
  | HEX
    { $$ = ["int", parseInt($1, 16)]; }
  | BINARY
    { $$ = ["int", parseInt($1, 2)]; }
  ;
blockparams
  : VERTBAR VERTBAR
    { $$ = []; }
  | VERTBAR IDENT VERTBAR
    { $$ = [$2]; }
  | VERTBAR MULTIPLY IDENT VERTBAR
    { $$ = ["*" + $3]; }
  | VERTBAR IDENT ',' blockparams2
    { $$ = [$2].concat($4); }
  ;
blockparams2
  : IDENT VERTBAR
    { $$ = [$1]; }
  | MULTIPLY IDENT VERTBAR
    { $$ = ["*" + $2]; }
  | IDENT ',' blockparams2
    { $$ = [$1].concat($3); }
  ;
property
  : funname '.' IDENT
    { $$ = ["property", $1, $3]; }
  ;
array
  : '[' ']'
    { $$ = []; }
  | '[' expr ']'
    { $$ = [$2]; }
  | '[' expr ',' array2
    { $$ = [$2].concat($4); }
  ;
array2
  : expr ']'
    { $$ = [$1]; }
  | expr ',' array2
    { $$ = [$1].concat($3); }
  ;
hash
  : '{' optnl '}'
    { $$ = {}; }
  | '{' optnl expr ':' expr optnl '}'
    { var h = {}; var k = {}; h[$2] = $4; k[$2] = $2; $$ = [k, h]; }
  | '{' optnl expr ':' expr ',' optnl hash2
    { console.log(h);var h = $8[1]; var k = $8[0]; h[$3] = $5; k[$3] = $3; $$ = [k, h]; }
  ;
hash2
  : expr ':' expr optnl '}'
    { var h = {}; var k = {}; h[$1] = $3; k[$1] = $1; $$ = [k, h]; }
  | expr ':' expr ',' optnl hash2
    { var h = $6[1]; var k = $6[0]; h[$1] = $3; k[$1] = $1; $$ = [k, h]; }
  ;
// 配列の内包表記
arrcomp
  : '[' expr VERTBAR arrcomp_assigns %prec COMPREHENSION
    { $$ = [$2, $4[0], $4[1]]; }
  ;
arrcomp_assigns
  : IDENT '<-' expr ',' expr ']'
    { $$ = [[[$1, $3]], $5]; }
  | IDENT '<' expr ']'
    { $$ = [[[$1, $3]], null]; }
  | IDENT '<-' expr ',' arrcomp_assigns
    { $$ = [[[$1, $3]].concat($5[0]), $5[1]]; }
  ;
// 配列のアクセス
access
  : funname '[' expr ']'
    { $$ = ["access", $1, $3]; }
  ;
// 省略可能な式の連続
optexprs
  :
    { $$ = []; }
  | exprs
    { $$ = $1; }
  ;
exprs
  : expr
    { $$ = [$1]; }
  | expr NEWLINE
    { $$ = [$1]; }
  | expr ';'
    { $$ = [$1]; }
  | expr NEWLINE exprs
    { $$ = [$1].concat($3); }
  | expr ';' exprs
    { $$ = [$1].concat($3); }
  | NEWLINE exprs
    { $$ = $2; }
  | ';' NEWLINE exprs
    { $$ = $3; }
  ;

binop
  : BINOP1
  | BINOP2
  | BINOP3
  | BINOP4
  | BINOP5
  | BINOP6
  | VERTBAR
  | MULTIPLY
  ;
params
  : '(' ')'
    { $$ = []; }
  | '(' IDENT ')'
    { $$ = [$2]; }
  | '(' MULTIPLY IDENT ')'
    { $$ = ["*" + $3]; }
  | '(' IDENT ',' params2
    { $$ = [$2].concat($4); }
  ;
params2
  : IDENT ')'
    { $$ = [$1]; }
  | MULTIPLY IDENT ')'
    { $$ = ["*" + $2]; }
  | IDENT ',' params2
    { $$ = [$1].concat($3); }
  ;

args
  : '(' ')'
    { $$ = []; }
  | '(' expr ')'
    { $$ = [$2]; }
  | '(' expr ',' args2
    { $$ = [$2].concat($4); }
  ;
args2
  : expr ')'
    { $$ = [$1]; }
  | expr ',' args2
    { $$ = [$1].concat($3); }
  ;
// optional NEWLINE
optnl
  :
  | NEWLINE
  ;