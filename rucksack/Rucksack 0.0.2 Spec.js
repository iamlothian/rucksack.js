// ########################################################
// $RUCKSACK
// ########################################################

// WIP for jotting down ideas

// ########################################################
// namespaces are used to group modules logicly:
// ########################################################

$rucksack.$namespace('NS1');
$rucksack.$namespace('NS1.A01.sub')

// a $namespace exposes the following moduloe constructors

$rucksack.$namespace('NS1')
.$value('ACCESSORS IDENTIFIER', VALUE)
.$value('Title', "Some Title")
.$value('private static employees', ['bob', 'caral', 'jim']);

// `$value` constructor accepts native types with no pependencies
// 'public static IDENTIFIER' has two access modifiers and the identifiier 'IDENTIFIER
// the default access if not specified is 'public instance'
// the value of 'employees' is an array or strings

// ########################################################

$rucksack.$namespace('NS1')
.$class('ACCESSORS IDENTIFIER', ['DEPENDENCY', function (DEPENDENCY) {
    this.property;
    var i_am_private;
    this.method = function () {
        return DEPENDENCY(this.property)
    }
}])

// `$class` is by default an 'abstract' module and cannot be accessed or injected by itself
// it does not accept the 'instance' or 'static' modifiers.
// A class is inteneded to be used to build complex reusable interfaces and constucts
// it is build around the `this` object any returned value will be ignored. It will be 
// instanciated using the `new` function constructor
// properties and methoud declared using var will be private and can share names with 
// public properties and methods

// EG:

var x = function () {
    this.a = 1;                 // public
    var a = 2;                  // private (these are differant even though they are both called a)

    // public
    this.m1 = function (n) {
        a = n || a;             // set `var a`
        console.log(this.a, a); // show values
        return m1();            // call private
    };
    // private
    var m1 = function () {
        console.log(this.a, a); // `this.a` is not accessable here but `var a` is
    };
}

var y = new x;
var z = new x;
y.m1(6); // => 1 6, undefined 6
z.m1(); // => 1 2, undefined 2

// y and z do not share any values

// ########################################################

$rucksack.$namespace('NS1')
.$define('ACCESSORS IDENTIFIER is CLASS...', ['DEPENDENCY', function (DEPENDENCY) {

    return module;

}])

// `$define` is used to create and implamented modules and classes it is built around
// the return value. 

$rucksack
.$await(['DEPENDENCY', function (DEPENDENCY) {

    // when DEPENDENCY is resolved run this code

}])

// `$await` is used to access rucksack modules from outside the runtime
// once all the requird dependencies are met. the function block will be run
// and forgoten

// ########################################################
// inherit example code
// ########################################################

var a = function () {
    this.a = "a";
}
var b = function () {
    this.b = "b";
}

var inherit = function () {

    return new (function (arguments) {
        for (arg in arguments) {
            typeof arguments[arg] === 'function'
            && arguments[arg].call(this);
        }
    })(arguments);
}
var c = inherit(a, b);


// ########################################################
// all modules are stored and linked with a $get function 
// ########################################################

// static accessor
var x = (function () {
    var module = (function (Dependencies) {
        return { prop: "som1" };
    })("Dependencies");
    return function () {
        return module;
    };
})();

// instance accessor
var x = (function () {
    var module = function (Dependencies) {
        return { prop: "som1" };
    };
    return function () {
        return new module("Dependencies");
    };
})();

// EG

$rucksack.$namespace('NS1')
    .value('public static employees', ['bob', 'caral', 'jim']);

// this would be compiled to 
moduleStack['NS1:employees'] = (function () {
    var module = (function () {
        return ['bob', 'caral', 'jim']
    })();
    return function () {
        return module;
    };
})();

// if the static keyword was left out the 
// instance accessor would be used
var x = (function () {
    var module = function () {
        return ['bob', 'caral', 'jim']
    };
    return function () {
        return new module();
    };
})();