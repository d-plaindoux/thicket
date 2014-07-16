/**
 * Entities and expressions
 */

// ----------------------------------------------------------------------
// Types 
// ----------------------------------------------------------------------

// IDENT
function TypeIdent(name) {
    this.name = name;
}

// Tuple type
function TypeTuple(types) {
    this.types = types;
}

// Function type
function TypeFun(type, type) {
    this.requires = type;
    this.provides = type;
}

// Array type
function TypeArray(type) {
    this.type = type;
}

// ----------------------------------------------------------------------
// Expressions 
// ----------------------------------------------------------------------

function Expression() {
    // Nothing
}

// NUMBER, STRING, CHAR
// signature: String -> Atom
function Atom(value) {
    // super
    this.value = value;
}

// IDENT
// signature: String -> Identifier
function Identifier(name) {
    this.name = name;
}

// this and self are part of the environment

// Sequence
// signature: expression* -> Sequence
function Sequence(expressions) {
    this.expressions = expressions;
}

// Dot expression
function Access(leftExpression, rightExpression) {
    this.leftExpression = leftExpression;
    this.rightExpression = rightExpression;
}

// Class instance
function NewInstance(name, expression) {
    this.name = name;
    this.parameters = parameters;
}

// Object structure
function NewObject(name, parameters) {
    this.name = name;
    this.parameters = parameters;
}

// Abstraction
function Abstraction(parameters, type, expression) {
    this.parameters = parameters;
    this.type = type;
    this.expression = expression;
}

// and variable declaration initialisation
function Variable(name, type, value) {
    this.name = name;
    this.type = type;
    this.value = expression;
}

// Tag
function Tag(name, attributes, expression) {
    this.name = name;
    this.attributes = attributes;
    this.content = expression;
}

function Attribute(name, expression) {
    this.name = name;
    this.value = expression;
}

// Selection control structure
function If(condition, thenExpression, elseExpression) {
    this.condition = condition;
    this.thenExpression = thenExpression;
    this.elseExpression = elseExpression;
}

// Loop control structure
function For(name, values, expression) {
    this.name = name;
    this.values = values;
    this.expression = expression;
}
    
