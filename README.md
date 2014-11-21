Movico
======

Language dedicated to Model/View/Control  web application design based
on  Model, Controller and  View  approach.  In  this  approach a model
denotes  a  set of  data  (atomic  or  object)  federated in  a  named
structure. A controller is a set of behaviors applied to a given object 
and finally  a  view  denotes  an   extended  DOM  fragment used for UI
management.

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
   age: Int = 0
}
```

A  controller provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`Person`  and  `Population`  are  proposed for  objects  `APerson`  and
`[APerson]`.

```
controller Person(this:APerson) {
  firstname() { this.firstname }
  name() { this.name }
  age() { this.age }
  tick() { self(this.age(this.age+1)) }
}

controller Population([APerson]) {
  persons() { [p | p <- this if p.age < 100] }
  addPerson(f,n) { self(APerson{f,n} : this) }
}
```

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `Person`  and   to  a
`Population`. These  views define  the UI  using HTML  fragments. This
approach is  similar to  [Reac](http://facebook.github.io/react/).

```
view PersonView(this:Person) {
  <div onClick=this.tick()> 
    <div>this.firstname()</>
    <div>this.name()</>
    <div>this.age()</>
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
view PersonAdder(this:Population) {
  <form onSubmit=this.addPerson(firstname,name)>
    <input type="text" id="firstname"/>
    <input type="text" id="name"/>
    <input type="submit" value="Add"/>
  </>
}

view PopulationView(this:Population) {
  [<PersonView>Person(p)</> | p <- this.persons()]
  <PersonAdder>this</>
}

// Document(document).byId("content").setValue(<PopulationView>Population([])</>)
// Document(document).import("...") -> Creates a view
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

Copyright (C)2014 D. Plaindoux.

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




