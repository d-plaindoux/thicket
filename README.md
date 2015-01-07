Movico 
======

[![Build Status](https://travis-ci.org/d-plaindoux/movico.svg)](https://travis-ci.org/d-plaindoux/movico) 
[![Coverage Status](https://coveralls.io/repos/d-plaindoux/movico/badge.png?branch=master)](https://coveralls.io/r/d-plaindoux/movico?branch=master) 
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Movico is a language based on Model, Controller and View approach.  In
this  approach  a model  denotes  a set  of  data  (atomic or  object)
federated in  a named  structure. A controller  is a set  of behaviors
applied to a  given object and finally a view  denotes an extended DOM
fragment used for UI management.

Movico is a  strong typed language based on  well known Hindley-Milner
type system and type inference paradigm.

Language Overview
=================

The Movico language  came from research done about  strong [object and
class   separation](http://d.plaindoux.free.fr/clump/index.html).   In
addition UI management done using DOM fragment is provided in order to
define  view   facet  in   addition  to   object  (model)   and  class
(controller).

A simple example
-----------------

First information and data are stored in an object. In our approach an
object is not  meant to have behaviors but only  provides a common and
simple  way  for  data  structuration and  storage.   It's  the  model
definition in the illustrated MVC design pattern.

```
model APerson {
   firstname: String
   name: String
   age: Int
}
```

A  class provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`Person`  and  `Population`  are  proposed for  objects  `APerson`  and
`[APerson]`. Such class is similar to a controller in charge of managing
a given model.

```
class Person this:APerson {  
  firstname: String
  name: String
  age: Int
  tick: self
} {
  def firstname = this.firstname
  def name = this.name
  def age = this.age
  def tick = Person this.firstname this.name 0
}

class Population this:[APerson] {
  persons   : int -> [APerson]
  addPerson : string -> string -> Population
} {
  def persons age = this.filter(fun p -> p.age <= age)
  def addPerson f n = Population (APerson f n)
}
```

*Notes* about syntactic sugar:

- `[T]` is equivalent to `(List T)`.
- `(F,S)` is equivalent to `(Pair F S)`.

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `Person`  and   to  a
`Population`. These  views define  the UI  using HTML  fragments. This
approach is  similar to  [Reac](http://facebook.github.io/react/).

```
view PersonView this:Person {
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
definition.   In  the  next  definition  a  `PersonAdder`  has  always
identified  elements  like  `firstname`  and  `name`.  Based  on  such
definition each `PersonAdder` instance  provides these definitions and
then can be referenced as we do in the `Population#addPerson` method.

```
view PersonAdder this:Population {
  let onSubmit = this.addPerson self.firstname self.name in
      <form onSubmit=onSubmit>
        <input type="text" id="firstname"/>
        <input type="text" id="name"/>
        <input type="submit" value="Add"/>
      </form>   
}

view PopulationView this:Population {
  [PersonView (Person p) for p in (this.persons 100)]
  (PersonAdder this)
}
```

More informations and References
================================

This language has been inspired  by major projects and frameworks like
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




