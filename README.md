Thicket
======

[![Build Status](https://travis-ci.org/d-plaindoux/thicket.svg)](https://travis-ci.org/d-plaindoux/thicket) 
[![Coverage Status](https://coveralls.io/repos/d-plaindoux/thicket/badge.png?branch=master)](https://coveralls.io/r/d-plaindoux/thicket?branch=master) 
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

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

A simple [Hello world](http://d.plaindoux.free.fr/thicket/examples/helloWorld.html) 
is available in order to demontrate the language. This current version 
if not yet optimized and  irectly manipulates the DOM. This does not yet 
provide a simple and convenient library for reactive UI support.

A simple example
-----------------

First information and data are stored in an object. In our approach an
object is not  meant to have behaviors but only  provides a common and
simple  way  for  data  structuration and  storage.   It's  the  model
definition in the illustrated MVC design pattern.

```
model Person {
   firstname: String
   name: String
   age: Int
}
```

A  class provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`person`  and  `population`  are  proposed for  objects  `Person`  and
`list[Person]`. Such class is similar to a controller in charge of managing
a given model.

```
class person this:Person {  
  firstname: String
  name: String
  age: Int
  tick: person
} {
  def firstname = this.firstname
  def name = this.name
  def age = this.age
  def tick = self $ Person this.firstname this.name (this.age + 1)
}

typedef Population = list[Person]

class population this:Population {
  unbox   : Population
  (<=)    : int -> population
  addNew  : string -> string -> population
} {
  def unbox = this
  def (<=) age = self [p for p in this if p <= 100]
  def addNew f n = self $ this +: (APerson f n)
}
```

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `person`  and   to  a
`population`. These  views define  the UI  using HTML  fragments. This
approach is  similar to [React](http://facebook.github.io/react/).

```
view personView this:person {
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
view personAdder this:population {
  let onSubmit = this addNew self.firstname self.name in
      <form onSubmit=onSubmit>
        <input type="text" id="firstname"/>
        <input type="text" id="name"/>
        <input type="submit" value="Add"/>
      </form>   
}

view populationView this:population {
  [personView (person p) for p in this <= 100 unbox]
  (personAdder this)
}
```

See current [Libraries](https://github.com/d-plaindoux/thicket/tree/master/thicket-src)
for more language highlights.

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




