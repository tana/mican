/*
  Comment
*/
%lex
%{
// Escape Sequences
unesctable = {};
unesctable["\n"] = "n";
unesctable["\t"] = "t";
unesctable["\b"] = "b";
unesctable["\v"] = "v";
unesctable["\f"] = "f";
unesctable["\r"] = "r";
unesctable["\""] = "\"";
unesctable["\'"] = "\'";
unesctable["\\"] = "\\";
%}
%s comment
%s blcomment
%x heredoc
%%
<INITIAL>\/\/[^\n\r]*  /* skip */
/*
<INITIAL>"//"    console.log("start"); this.begin('comment');
<comment>[\n|\r\n]+   this.begin('INITIAL'); yytext += "\n"
<comment>[^\n]      * skip *
*/
/* nested block comment */
<INITIAL>"/*"   this.begin('blcomment'); commentcnt = 0;
<blcomment>"/*" commentcnt++;
<blcomment>"*/" commentcnt--; if (commentcnt < 0) this.begin('INITIAL');
<blcomment>\n|\r\n  return 'NEWLINE'
<blcomment>.|\n|\r\n    /* skip */
/* here document */
<INITIAL>"\"\"\""       this.begin('heredoc'); yytext = "\""; return('CHAR');
<heredoc>"\"\"\""       this.begin('INITIAL'); yytext = "\""; return('CHAR');
<heredoc>.|\n|\r\n|\s      {
  if (yytext in unesctable) yytext = "\\" + unesctable[yytext];
  if (yytext == "\r\n") yytext = "\\" + unesctable["\n"];
  return('CHAR');
}

(.|\n|\r\n)    return 'CHAR';

/lex

%start dummy
%%
dummy
  : charseq
    { return $1; }
  ;
charseq
  : CHAR
    { $$ = $1; }
  | NEWLINE charseq
    { $$ = $1 + $2; }
  | CHAR charseq
    { $$ = $1 + $2; }
  ;