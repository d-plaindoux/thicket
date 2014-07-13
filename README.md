MovicoJS
========

Language dedicated to Model/View/Control  web application design based
on  Object/Class and  View  separation.  In  this  approach an  object
denotes  a  set of  data  (atomic  or  object)  federated in  a  named
structure. A class is a set of behaviors applied to a given object and
finally  a  view  denotes  an   extended  DOM  fragment  used  for  UI
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
object APerson { 
   firstname: string, 
   name: string, 
   age: int 
}
```

A  class provides  a  set of  behaviors where  the  internal state  is
represented by  a model.  For instance  in the  next code  two classes
`Person`  and  `Popuation`  are  proposed for  objects  `APerson`  and
`[APerson]`.

```
class Person(APerson) {
  firstname(): string { this.firstname }
  name(): string { this.name }
  age(): int { this.age }
  tick(): Unit { this = this.age(this.age+1) }
}

class Population([APerson]) {
  persons():[APerson] { 
    this.select((p) -> p.age < 100); 
  }
  addPerson(v:PersonAdder): Unit { 
    this = Array(this).addFirst(APerson{v.firstname,v.name,v.age}); 
  }
}
```

Finally  views can  be  designed  and linked  to  controllers. In  the
example  we   propose  views  dedicated   to  a  `Person`  and   to  a
`Population`. These  views define  the UI  using HTML  fragments. This
approach is similar to [Reac](http://facebook.github.io/react/).

```
view PersonView(Person) {
  <div onClick=this.tick()> 
    <div>this.firstname()</>
    <div>this.name()</>
    <div>this.age()</>
  </>
}
 
view PersonAdder(Population) {
  <form onSubmit=this.addPerson(self)>
    <input type="text" id="firstname"/>
    <input type="text" id="name"/>
    <input type="text" id="age"/>
    <input type="submit" value="Add"/>
  </>
}

view PopulationView(Population) {
  this.persons().map((p) -> <PersonView>Person(p)</> )
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




