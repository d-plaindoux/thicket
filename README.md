# Thicket

[![Build Status](https://travis-ci.org/d-plaindoux/thicket.svg)](https://travis-ci.org/d-plaindoux/thicket) 
[![Coverage Status](https://coveralls.io/repos/d-plaindoux/thicket/badge.png?branch=master)](https://coveralls.io/r/d-plaindoux/thicket?branch=master) 
[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Thicket is a language based on Model, Controller and View approach. In
this  approach  a model  denotes  a set  of  data  (atomic or  object)
federated in  a named  structure. A controller  is a set  of behaviors
applied to a  given model or controller and finally a view  denotes an 
extended DOM fragment used for UI management.

Thicket is a  strong typed language based on well known Hindley-Milner
type system and type inference paradigm. The runtime is based on an
Krivines' abstract machine. Such machine can therefore be implemented 
in various languages like Java, Python etc. The Thicket source code 
is compiled and the resulting objcode is executed by an abstract machine 
derived from Krivines' machine. For instance the previous example uses 
data structure like [Option](https://github.com/d-plaindoux/thicket/blob/master/thicket/core/data/option.tkt)
which is compiled to the [objcode](http://d.plaindoux.free.fr/thicket/site/Data.Option.tkt.o). 

## Online examples

### Hello World

A simple [Hello world](https://github.com/d-plaindoux/thicket/blob/master/thicket/examples/helloWorld.html) 
is available for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/helloWorld.html).

### Todo MVC

The [TODO](https://github.com/d-plaindoux/thicket/tree/master/thicket/examples/todoMVC/) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/todoMVC/index.html) shows a complete
example based on dom manipulation.

### Thicket Console

The [Console](https://github.com/d-plaindoux/thicket/tree/master/thicket/examples/thicket) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/thicket/console.html) shows how the 
runtime can be easily extended in order to provide a naive embedded interpret in the web browser.

### Unit testing

The [Test](https://github.com/d-plaindoux/thicket/tree/master/thicket/examples/tests) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/tests/assertSpecs.html) shows how
unit testing can be done just changing the logger used for the results display.

## Language Overview

The Thicket language  came from research done about  strong [object and
class   separation](http://d.plaindoux.free.fr/clump/index.html).   In
addition UI management done using DOM fragment is provided in order to
define  view   facet  in   addition  to   object  (model)   and  class
(controller).

### Model

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
### Class

A  class provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`person`  and  `population`  are  proposed for  objects  `Person`  and
`list[Person]`. Such class is similar to a controller in charge of managing
a given model.

```
class person this:Person {  
  with Person
  
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
  def (<=) age = population for p <- this if p <= 100 yield p
  def addNew f n = population $ this +: (Person f n 0)
}
```

### View using DOM fragment

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `person`  and   to  a
`population`. These  views define  the UI  using HTML  fragments. This
approach is  similar to [React](http://facebook.github.io/react/).

```
def personView : person -> dom = this -> {
  <div> 
    <div>this.firstname</div>
    <div>this.name</div>
    <div>this.age</div>
  </div>
  onMouseEvent MouseClick $ _ -> this.tick
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
def personAdder : population -> dom = this -> {
    <form>
        <input type="text" id="firstname"/>
        <input type="text" id="name"/>
        <input type="submit" value="Add"/>
    </form>
    onFormEvent OnSubmit $ d ->
        for firstname <- { d find "firstname" }
            name      <- { d find "name"      } 
        yield this addNew firstname name
}

def populationView : population -> dom = population -> {
    <div>
        { for p <- (population <= 100 unbox) yield personView $ person p }
        { personAdder this }
    </div>
}
```

See current 
[Libraries](https://github.com/d-plaindoux/thicket/tree/master/thicket/core)
for more language highlights and 
[Examples](https://github.com/d-plaindoux/thicket/tree/master/thicket/examples)
for small web and backend applications

### Adapters

Implicit data adaptation can be done in order to reduce boiler plate 
when dealing with objects. For instance when a `Comparable[number]` is
required this one can be transparently created from a `number`. 

```    
def adapter number2comparable : number -> Comparable[number] = s -> {
    Comparable s s.(==) s.(!=) s.(?>) s.(<?) (number2hashable s)
}

// newHashmap add 1 "a" === newHashmap add (number2comparable 1) "a"
```

Since subtyping is not a paradigm available in the language the adapter
is the solution performing automatic data adaptation. These adaptations
can be ordered explicitely or inferred by the compiler during the type 
checking stage. Since definitions accessibility is managed using imports
if such adapters are not imported the related transformations are not
available.

Since adaptation is not transitive all required transformations must be 
expressed using dedicated adapters.

This can be compared to **implicit conversion** mechanism available in 
[Scala](http://docs.scala-lang.org/overviews/core/implicit-classes.html) 
or [C#](https://msdn.microsoft.com/fr-fr/library/xhbhezf4.aspx). 

### Derivation

Class derivation can help reducing specification by copy. But this derivation 
is not meant to be used for subtyping since subtyping does not exist in the 
language. For this purpose the adapter is the preferred solution.

````
model Equal[a] { 
    (==) : a -> bool
)

class number this:native {
    with Equal[number]
} {
    def (==) = ...
}
```

Derivation can be used for adapters synthesis. In fact each time a derivation is specified the corresponding 
adapter can be easily generated and therefore used to "simulate" subtyping based on implicit object transformation.

### Traits

A trait is an abstract component providing behaviors without any constraint 
related to the denoted data type.

```
model Comparable[a] {
    (!=) : a -> bool
    (<=) : a -> bool
    (=>) : a -> bool
    (<?) : a -> bool
    (?>) : a -> bool
}

trait comparable[a] {
    with Comparable[a]
} {
    def (!=) n = (self == n) not    
    def (<=) n = (self == n) || (self <? n)
    def (=>) n = n <? self
    def (?>) n = n <= self    
}

class bool this:Bool {
    with comparable[bool]
    fold : [b] b -> b -> b
} {
    def True.fold t _ = t
    def False.fold _ f = f
    
    def (==) b = self fold b b.not    
    def (<?) b = self fold false (b fold false true)
}
```

## Not yet in the language

### String interpolation

String interpolation unleashes string construction allowing string embedded code.

```
model Message {
    id   : number
    text : string 
}

def logMessage : Message -> console = m -> 
    console.log @"${date current}::${m.id} - ${m.text}" 
```

### Type of self in traits

Since traits defines partial definitions allowing self usage the related type is only
known when such trait is used in a class.

```
trait Set[M a] {
    empty  : bool
    size   : number
    // Etc.    
} {
    def empty = self size == 0
}
```

In this example `self` has the behavior `size` because *it's an implementation* 
of a `Set`. But what does *implementation* means in the type system. In fact the 
self type is a type containing `Set` specification i.e. a class with a derivation
to this trait. 

For the moment the type of self is the trait type itself but this approach is not 
fulfiling. 

### Model pattern matching

Method selection in a class is done using the model selector i.e. it's name. 
Unfortunately such approach is well adapted when a method must be selected during 
the lookup stage but the code seggragation is poor. Pattern matchign can offer 
expressiveness unleashing model pattern definition and matching operation used 
for inductive computation.

```
def adder : list[number] -> number = l -> {
    l match {
    case Nil      => 0
    case Cons i l => adder l + i
    }
}
```

## More informations and References

This language has been inspired  by major projects and frameworks like
[Purescript](https://github.com/purescript/purescript),
[AngularJS](https://angularjs.org),
[React](http://facebook.github.io/react/) ...  In addition the Virtual
DOM  approach is  also  studied in  order to  provide  a reactive  and
efficient DOM management process.

## License

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




