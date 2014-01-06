
# Matthew Lothian @ Autumn01 2013/12/20 #
#        Rucksack.js 0.0.1 (Alpha)      #


MileStones / Features:
  - [x] Modular
  - [x] Factory constructor
  - [x] Service constructor
  - [x] Lazzy loading
  - [x] Easy error logging
  - [x] Namespaces
  - [x] Sealable modules and namespaces
  - [x] Global await event for single module
  - [x] Global await event for multipul modules
  - [x] Make interface for optional config object
  - [x] Build optional strict interface checks for injection
 
TODO / Wishlist  

  - [ ] Global await event for one or more namespaces
  - [ ] extension of existing public modules (inheritence)
  - [ ] Load external js file with callback

___
# Getting Started #
___
  ### $namespace ### 
    namespace : $rucksack.$namespace(String:NAME[, Object:OPTIONS]);
  
  EG:
  
    var MyNamespace = $rucksack.$namespace("MyNamespace", { sealed : true });
  
  Description: $namespace is how you interface with and organize your rucksack modules.
___ 
# Modules #
___  
  ### $service ###
  
  module with a static like intent, built around the this object 
  
    void : $namespace.$service(String:NAME, [String:DEPENDENCY_KEY, ..., Function(D1, ...){
      this.property = SomeValue
    }] [, Object:OPTIONS] ) 
  
  ### $factory ### 
  
  a module with an instanciable like intent, built around the return object
  
    void : $namespace.$factory(String:NAME, [String:DEPENDENCY_KEY, ..., Function(D1, ...){
      return SomeValue
    }] [, Object:OPTIONS] ) 
  
  EG:
  
    MyNamespace.$factory("MyNamespace:m1", [function(){
      return (function(greating){
        return { response : greating + " MyNamespace:m1" }
      });
    }]);
    
    MyNamespace.$service("MyNamespace:m2", [function(){
      this.response = "MyNamespace:m2";
      this.foobar = function(arg1, arg2, arg3) { ... };
    }]);
  
    App.$service("App:m1", ["MyNamespace:m1", "MyNamespace:m2", function(m1, m2){
      this.response = "App:m1 with " + new m1("hello").response + m2.response;
    }], { sealed : true });
    
    
  
  Description: $service and $factory are how you add / inject your code into modules.
  
  NOTE: Name can be provided as "m1" but will be converted to "MyNamespace:m1" for you
  
  ### $interface ### 
  
  a module with an abstract like intent, used to describe and validate the expected properties injected modules.
  
    MyNamespace.$interface("i1", {
       $constructor: ["function", ["greating"], ["hello"]]
      ,response: ["string"]
    });
    
    MyNamespace.$interface("i2", {
       response: ["string"]
      ,foobar: ["function", ["arg1", "arg2", "arg3"]]
    });
    
  this may be used like so
    
    App.$service("App:m1", ["MyNamespace:m1 as MyNamespace:i1", "MyNamespace:m2 as MyNamespace:i2", function(m1, m2){
      this.response = "App:m1 with " + new m1("hello").response + m2.response;
    }], { sealed : true });
  
  The $constructor property is used to build a dumby instace of a module that requires constructing
  
  ### $await ###
  
  a listener module intended to be used to wait for dependencies to be resolved before use
  unlike other modules no constructor is compiled, only a true value if the await is resolved

    $rucksack.$await("AppReady", ['App:m1', function(m1){
      ...
    }]);
    
  ### $describe ###
  
  also available as an option on a module. Describe is intended as an 
  option methoud of internal documentation for debugging and describing you modules

  Set:

    MyNamespace.$service("MyNamespace:m2", [function(){
      this.response = "bla";
    }], { 
      descriptor : {
        response : "type: string, A response property"
      }
    });
    
  OR
  
    MyNamespace.$describe("MyNamespace:m2", {
      response : "type: string, A response property"
    });
    
  Get:
    
    console.log(MyNamespace.$describe("MyNamespace:m2"));
  