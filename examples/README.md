Examples
======

In this directory some examples are provided in order to illustrate
the language expressiveness.

Todo
-----

The first example illustrate a todo list and its presentation using
simple HTML list and basic reentrant click callback.

This example requires the `thicket-lang.js` built calling the command:

```
$ grunt package
```

Lambda Calcul
-------------

This example illustrates a simple lambda calcul interpreter.

```Shell
$ ./bin/thicket -i site/
Thicket v0.1
> import Examples.Lambda ;;
> interpreter (Application lIdent $ Constant "C")
        eval new$map.mapper 
        map (s -> console.log valueClass s pretty) 
;;
C
try[consoleClass] :: <class try>
>
```

Miscellaneous 
-------------

Some functions like tail recursive factorial or fast fibonacci based
on memoization are provided.

Peano Numbers
-------------

Peanos' number representation and interpretation.
