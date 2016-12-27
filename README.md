# Thicket

[![Build Status](https://travis-ci.org/d-plaindoux/thicket.svg)](https://travis-ci.org/d-plaindoux/thicket) 
[![Coverage Status](https://coveralls.io/repos/d-plaindoux/thicket/badge.png?branch=master)](https://coveralls.io/r/d-plaindoux/thicket?branch=master) 
[![unstable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Thicket is a lazy functional programming language. It has been inspired at the beginning by the Model, Controller and View approach. In this  approach  a model  denotes  a set  of  data  (atomic or  object) federated in  a named  structure. A controller  is a set  of behaviors applied to a  given model or controller and finally a view  denotes an extended DOM fragment used for UI management.

Thicket is a  strong typed language based on well known Hindley-Milner type system and type inference paradigm. The Thicket source code 
is compiled and the resulting objcode is executed by an abstract machine derived from Krivines' machine. Such abstract machine can therefore be implemented in various languages like Java, Python etc. 

## Online examples

### Hello World

A simple [Hello world](https://github.com/thicket-lang/thicket-examples/blob/master/helloWorld/index.html) 
is available for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/helloWorld.html).

### Todo MVC

The [TodoMVC](https://github.com/thicket-lang/thicket-examples/tree/master/todoMVC) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/todoMVC/index.html) shows a complete
example based on dom manipulation.

### Thicket Console

The [Console](https://github.com/thicket-lang/thicket-examples/tree/master/thicket) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/thicket/console.html) shows how the 
runtime can be easily extended in order to provide a naive embedded interpret in the web browser.

### Unit testing

The [Test](https://github.com/thicket-lang/thicket-examples/tree/master/tests) example available 
for execution [here](http://d.plaindoux.free.fr/thicket/thicket/examples/tests/assertSpecs.html) and 
[here](http://d.plaindoux.free.fr/thicket/thicket/examples/tests/assertSpecs.2.html) shows how
unit testing can be done just changing the logger used to display the result.

### Additional projects

Some projects are also available in Hyperweb and can be browsed and executed seamlessly. For instance 
a [naive &lambda;-calculus evaluation](https://helix-fairy.gomix.me) is available for test.

## Language Overview

The Thicket language  came from research done about  strong object and
class   separation. In addition UI management done using DOM fragment 
is provided in order to define  view   facet  in   addition to object  
(model)   and  class (controller).

### Model

**keywords:** *data denotation*

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

Then using such model creating an instance can be easily done. In fact a
model defines a generator which is a function named with the model name.

```
// Person : string -> string -> number -> Person
Person "John" "Doe" 42
```

### Class

**keywords:** *behavior - control - denotation*

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
```
Then using such class creating an instance can be easily done. In fact a
class defines a generator which is a function named with the class name.

```
// person : Person -> person
person (Person "John" "Doe" 42)
```

In addition we can define type in order to increase specification readability
using typedef capability and reuse this new type definition when defining
entities.

```
typedef Population = list[Person]

class population this:Population {
  unbox: Population
  (<=): number -> population
  addNew: string -> string -> population
} {
  def unbox = this
  def (<=) age = population for p <- this if p <= 100 yield p
  def addNew f n = population $ this +: (Person f n 0)
}
```
### View using DOM fragment

**keywords:** *templating, UI fragment*

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

See current [Libraries](https://github.com/thicket-lang) for more language highlights and 
[Examples](https://github.com/thicket-lang/thicket-examples) for small web and backend 
applications.

### Adapters

**keywords:** *substitutability, implicit transformation*

Implicit data adaptation can be done in order to reduce boiler plate 
when dealing with objects. For instance when a `string` is required 
this one can be transparently created from a `number`. 

```    
def adapter number2string : number -> string = number::toString

// "a" + 1 === "a" + (number2string 1) === "a1"
```

These adaptations can be ordered explicitely or inferred by the compiler 
during the type checking stage. Adapter accessibility is managed using 
imports then if such an adapter is not imported the related transformation 
is not available.

Finally adaptation is not transitive. For this purpose all required transformations 
must be expressed using dedicated adapters.

This can be compared to **implicit conversion** mechanism available in 
[Scala](http://docs.scala-lang.org/overviews/core/implicit-classes.html) 
or [C#](https://msdn.microsoft.com/fr-fr/library/xhbhezf4.aspx). 

### Derivation

**keywords:** *classification, reusability, subtype*

Class derivation can help reducing specification based on classification. Such 
derivation is the main paradigm used for the subtyping relationship and then the
substitutability principle availability.

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

Then each time a `Equal[number]` parameter is required a number can be proposed for 
instance. This implies the avaibility of the subtyping type relationship implied by 
the derivation declaration in the language.

### Traits

**keywords:** *abstract behavior denotation, derivable, composition*

A trait is an abstract component providing behaviors without any constraint 
related to the denoted data type.

```
model Comparable[a] {
    (==) : a -> bool
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

### Private behaviors

**keywords:** *privacy, behavior protection*

A trait or a class can be defined with provite behaviors. Such definitions
are then only available when using 'self'. A private behavior is defined with 
a type in the definition section. 

```
trait page {
    create : dom -> dom
} {
    def header : dom = <div class="header"> "..." </div>
    def footer : dom = <div class="footer"> "..." </div>
    def create d = <body> self.header d self.footer </body>
}
```

### String interpolation

**keywords:** *string format, injected expression*

String interpolation unleashes string construction allowing string embedded code.

```
model Message {
    id   : number
    text : string 
}

def logMessage : Message -> console = m -> 
    console.log $"${date current}::${m id} - ${m text}" 
```

### System Evolution

**keywords:** *immutablity, data evolution/mutation*

Since immutability is an important paradgim in the language data mutability is based on 
object evolution rather than object modification using side effects. For this purpose
a dedicated instruction is proposed. The result of such instruction is a new data built 
using an original and a set of modified attributes or methods. A data can be simple model
instance but also a class instance. This last perspective allows code mutation.

#### Model Evolution

In the following example the address is defined in the `Person` model. Then changing address 
can be done but at the model level.

```
model Person {
   name : string
   address : string
}

def changeAddress : string -> Person -> Person = s p -> {
   new p with address=s
}
```

#### Class Evolution

In the following example the address is defined in the class instead in the `Person` model. 
Then changing address can be done but at the class level.

```
model Person {
   name : string
}

class localizedPerson this:Person {
   with Person
   address : option[string]
   changeAddress : string -> localizedPerson
} {
   def name = this name
   def address = none
   def changeAddress s = new self with address=(some s)
}
```

## Not yet in the language

### Type of self in traits

Since traits defines partial definitions allowing self usage the related type is only
known when such trait is used in a class.

```
trait Set[M,a] {
    empty  : bool
    size   : number
    // Etc.    
} {
    def empty = self size == 0
}
```

In this example `self` has the behavior `size` because *it's an 
implementation* of a `Set`. But what does *implementation* means in the 
type system. In fact the self type is a type containing `Set` 
specification i.e. a class with a derivation to this trait. 

For the moment the type of self is the trait type itself but this approach 
is not fulfiling. 

## TODO

### Type checker level

#### Consistency

For each class definition check the consistency in order to reject 
partial class definition since a class cannot abstract. Not used as-is 
in another one using the `with` declaration.

### Code generation level

#### Generated code optimization

The current version of the generated code refers to the module in two
many levels (module entity, model, class ... and ident). This repetition
must be build when specifications are loaded (synthetized).

#### Constant pool

Each constant like strings, number etc. must be stored in a constant pool
like in the class representation for the `JVM`. This implies a more compact 
specification file.

## More informations and References

This language has been inspired  by major projects and frameworks like
[Purescript](https://github.com/purescript/purescript) and
[React](http://facebook.github.io/react/). In addition the Virtual DOM
approach is also studied in order to provide a reactive and efficient 
DOM management process.

## License

Copyright (C)2015-2016 D. Plaindoux.

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




