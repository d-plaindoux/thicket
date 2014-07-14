/**
 * Entities and expressions
 */

// MISSING types and entities

// NUMBER, STRING, CHAR
var Atom = function(value) {
    this.value = value;
}

// IDENT
var Identifier = function(name) {
    this.name = name;
}

// this and self are part of the environment

// Sequence
var Sequence = function (expressions) {
    this.expressions = expressions;
}

// Dot expression
var Access = function (leftExpression, rightExpression) {
    this.leftExpression = leftExpression;
    this.rightExpression = rightExpression;
}

// Class instance
var NewInstance = function(name, expression) {
    this.name = name;
    this.parameters = parameters;
}

// Object structure
var NewObject = function(name, parameters) {
    this.name = name;
    this.parameters = parameters;
}

// Abstraction
var Abstraction = function(parameters, type, expression) {
    this.parameters = parameters;
    this.type = type;
    this.expression = expression;
}

// Variable declaration and initialisation
var Variable = function (name, type, value) {
    this.name = name;
    this.type = type;
    this.value = expression;
}

// Tag
var Tag = function(name, attributes, expression) {
    this.name = name;
    this.attributes = attributes;
    this.content = expression;
}

var Attribute = function (name, expression) {
    this.name = name;
    this.value = expression;
}

// Selection control structure
var If = function(condition, thenExpression, elseExpression) {
    this.condition = condition;
    this.thenExpression = thenExpression;
    this.elseExpression = elseExpression;
}

// Loop control structure
var For = function(name, values, expression) {
    this.name = name;
    this.values = values;
    this.expression = expression;
}
    
