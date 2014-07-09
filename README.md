MovicoJS
========

Language dedicated to Model/View/Control web application design based on Object/Class and View separation.
In this approach an object denotes a set of data (atomic or object) federated in a named structure. A class
is a set of behaviors applied to a given object and finally a view denotes an extended DOM fragment used for
UI management.

Language Overview
=================

An simple example
-----------------

First informations and data are stored in object. In our approach an object is not meant to have behaviors
but only provides a common and simple way for data structuration and storage. It's the model definition in
the illustrated MVC design pattern.

```
object APerson { 
   firstname: string, 
   name: string, 
   age: int 
}
```

A class provides a set of behaviors where the internal state is represented by a model. For instance in the next 
code two classes `Person` and `Popuation` are proposed for objects `APerson` and `[APerson]`.

```
class Person(APerson) {
  firstname(): string { this.firstname; }
  name(): string { this.name; }
  age(): int { this.age; }
  tick(): Unit { this = this.age(this.age+1); }
}

class Population([APerson]) {
  persons():[APerson] { this.select(p -> p.age < 100); }
  addPerson(v:PersonAdder): Unit { this = Array(this).addTail(APerson{v.firstname,v.name,v.age}); }
}
```

Finally views can be designed and linked to controllers.

```
view PersonView(Person) {
  <div onClick=this.tick()> 
    <div>this.firstname()</div>
    <div>this.name()</div>
    <div>this.age()</div>
  </div>
}
 
view PersonAdder(Population) {
  <form onSubmit=this.addPerson(self)>
     <input type="text" id="firstname"/>
     <input type="text" id="name"/>
     <input type="text" id="age"/>
     <input type="submit" value="Add"/>
  </form>
}

view PopulationView(Population) {
  this.persons().map(p -> <PersonView>Person(p)</PersonView>)
  <PersonAdder>this</PersonAdder>
}

// starter
// Document(document).render("content",PopulationView(Population([]))
// Document(document).import("...") -> Creates a view
```

More informations and References
================================

This language has been inspired by major projects and frameworks like AngularJS, ReactJS ... In addition the 
Virtual DOM approach is also adopted for optimal DOM update and management.

License
=======

Copyright (C)2014 D. Plaindoux.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 2, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program; see the file COPYING. If not, write to the Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.




