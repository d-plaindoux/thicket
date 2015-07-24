Thicket
======

[![Build Status](https://travis-ci.org/d-plaindoux/thicket.svg)](https://travis-ci.org/d-plaindoux/thicket) 
[![Coverage Status](https://coveralls.io/repos/d-plaindoux/thicket/badge.png?branch=master)](https://coveralls.io/r/d-plaindoux/thicket?branch=master) 
[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Thicket is a language based on Model, Controller and View approach.  In
this  approach  a model  denotes  a set  of  data  (atomic or  object)
federated in  a named  structure. A controller  is a set  of behaviors
applied to a  given object and finally a view  denotes an extended DOM
fragment used for UI management.

Thicket is a  strong typed language based on  well known Hindley-Milner
type system and type inference paradigm. The runtime is based on an
Krivines' abstract machine. Such machine can therefore be implemented 
in various languages like Java, Python etc.

Language Overview
=================

The Thicket language  came from research done about  strong [object and
class   separation](http://d.plaindoux.free.fr/clump/index.html).   In
addition UI management done using DOM fragment is provided in order to
define  view   facet  in   addition  to   object  (model)   and  class
(controller).

Hello World
-----------

A simple [Hello world](https://github.com/d-plaindoux/thicket/blob/master/thicket/examples/helloWorld.html) 
is available for execution [here](http://d.plaindoux.free.fr/thicket/examples/helloWorld.html) in 
order to demontrate the language. This current version if not yet optimized and directly manipulates 
the DOM. This does not yet provide a simple and convenient library for reactive UI support. 

As mentionned The Thicket source code is compiled and the resulting objcode is executed 
by an abstract machine derived from Krivines' machine. For instance the previous example 
uses data structure like [Option](https://github.com/d-plaindoux/thicket/blob/master/thicket/core/data/option.tkt)
which is compiled to the [objcode](http://d.plaindoux.free.fr/thicket/site/Data.Option.tkt.o.txt). 

A simple example
-----------------

First information and data are stored in an object. In our approach an
object is not  meant to have behaviors but only  provides a common and
simple  way  for  data  structuration and  storage.   It's  the  model
definition in the illustrated MVC design pattern.

```
model Person {
   firstname: string
   name: string
   age: number
}
```

A  class provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`person`  and  `population`  are  proposed for  objects  `Person`  and
`list[Person]`. Such class is similar to a controller in charge of managing
a given model.

```
class person this:Person {  
  firstname: string
  name: string
  age: number
  tick: person
} {
  def firstname = this.firstname
  def name = this.name
  def age = this.age
  def tick = person new this with age=(this.age + 1)
}

typedef Population = list[Person]

class population this:Population {
  unbox   : Population
  (<=)    : number -> population
  addNew  : string -> string -> population
} {
  def unbox = this
  def (<=) age = population for p in this if p <= 100 yield p
  def addNew f n = population $ this +: (Person f n 0)
}
```

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `person`  and   to  a
`population`. These  views define  the UI  using HTML  fragments. This
approach is  similar to [React](http://facebook.github.io/react/).

```
def personView : person -> dom = this -> {
  <div onClick=this.tick> 
    <div>this.firstname</div>
    <div>this.name</div>
    <div>this.age</div>
  </>
}
```

The main  purpose of views is  the capability to define  a specific UI
(HTML  fragment) in  a  single and  isolated  block.  Then  identified
elements become  part of  the definition in  opposite to  anonymous UI
definition.   In  the  next  definition  a  `personAdder`  has  always
identified  elements  like  `firstname`  and  `name`.  Based  on  such
definition each `PersonAdder` instance  provides these definitions and
then can be referenced as we do in the `Population#addPerson` method.

```
def personAdder : population -> dom = this ->
  let onSubmit = this addNew self.firstname self.name in
      <form onSubmit=onSubmit>
        <input type="text" id="firstname"/>
        <input type="text" id="name"/>
        <input type="submit" value="Add"/>
      </form>

def populationView : population -> dom = this ->
  <div>
      { for p <- (this <= 100 unbox) yield personView $ person p }
      { personAdder this }
   </div>
```

See current 
[Libraries](https://github.com/d-plaindoux/thicket/tree/master/thicket-core)
for more language highlights and 
[Examples](https://github.com/d-plaindoux/thicket/tree/master/thicket-examples)
for small web and backend applications

TODO
================================


Derivation
----------

Class derivation can help reducing specification by copy. But this 
derivation is not meant to be used for subtyping since subtyping
does not exist in the language. For this purpose the adapter is 
the preferred solution.

````
model Equal[a] { 
    (==) : a -> bool
)

class number this:native {
    derives Equal[number]
} {
    def (==) = ...
}
```

Adapters
--------

Implicit adapters must be done in order to reduce boiler plate when
dealing with objects. For instance when a `Comparable[number]` is
required this one can be transparently created from a `number`. 

```
def adapter number2comparable : number -> Comparable[number] = 
    s -> ...
```

Since subtyping is not a paradigm available in the language the adapter
is the solution performing automatic data adaptation. These adaptations
can be ordered explicitely or inferred by the compiler during the type 
checking stage. Since definitions accessibility is managed using imports
if such adapters are not imported the related transformations are not
available.

This can be compared to **implicit conversion** mechanism available in 
[Scala](http://docs.scala-lang.org/overviews/core/implicit-classes.html) 
or [C#](https://msdn.microsoft.com/fr-fr/library/xhbhezf4.aspx) .

Model type case
---------------

Since model type exists for methods this does not exist yet for model
type based.

```
expression match {
case Nil       => ...
case Cons as l => ... // l can be used for extraction
}
```

The `match` function  can be seen as a standard construction of the language


Existential type
----------------

Existential type provides the ability to separate the model implementation
from the model specification. 


More informations and References
================================

This language has been inspired  by major projects and frameworks like
[Purescript](https://github.com/purescript/purescript),
[AngularJS](https://angularjs.org),
[React](http://facebook.github.io/react/) ...  In addition the Virtual
DOM  approach is  also  studied in  order to  provide  a reactive  and
efficient DOM management process.

License
=======

Copyright (C)2015 D. Plaindoux.

This program is  free software; you can redistribute  it and/or modify
it  under the  terms  of  the GNU  Lesser  General  Public License  as
published by  the Free Software  Foundation; either version 2,  or (at
your option) any later version.

This program  is distributed in the  hope that it will  be useful, but
WITHOUT   ANY  WARRANTY;   without  even   the  implied   warranty  of
MERCHANTABILITY  or FITNESS  FOR  A PARTICULAR  PURPOSE.  See the  GNU
Lesser General Public License for more details.

You  should have  received a  copy of  the GNU  Lesser General  Public
License along with  this program; see the file COPYING.  If not, write
to the  Free Software Foundation,  675 Mass Ave, Cambridge,  MA 02139,
USA.




