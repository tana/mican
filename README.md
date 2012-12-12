Mican Programming Language
=============================
Mican is a programming language compiled to Javascript.

Mican has both indentation syntax like Python and curly bracket syntax like Javascript.

Mican also has block syntax like Ruby.

*WARNING: Mican is Experimental. *


Feature
---------
### Indentation syntax

    def func(x):
      x + 1
### Curly bracket syntax

    def func(x) {
      x + 1
    }
### Classes

    class Parent:
      def new():
        console.log("Constructor of Parent")
      def a():
        console.log("a")
        
    class Child extends Parent:
      def new():
        super()
        console.log("Constructor of Child")
      def a():
        console.log("a of Child")
        
    child = new Child()
    child.a()
### Blocks
    map([1, 2, 3]): |a|
      console.log(a)
    map([4, 5, 6]) {|a|
      console.log(a)
    }
These are syntax sugar of
    `map([1, 2, 3], fun(a) -> console.log(a))`
### Variadic functions

    def func(a, b, *rest):
      console.log(a)
      console.log(b)
      console.log(rest)
    func(1, 2, 3, 4, 5, 6, 7, 8, 9)

Install
---------
1. Download zip or tar.gz file
2. Extract the file
3. `cd mican-master`
4. `npm install . -g`

Usage
--------
`mican program.mican`

Generated JavaScript program contains Mican's standard library.
If you don't want it (e.g. using multiple source files in single page), you can use `mican -n program.mican`.


License
--------
MIT License
