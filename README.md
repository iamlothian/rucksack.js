rucksack.js
===========

### rucksack javascript framework

This repository is split into two project folders set up to run in Visual Studio 2013. 
The test project is set up to run using:

* http://chutzpah.codeplex.com/
* https://jasmine.github.io/

## What is it?

Rucksack.js a light weight vanilla js framework for building modular js code using lazy loaded dependency injection. 

It also provides namespace, sealable or private modules, dependency interfaces requirements, detailed global error handling for any error with the modules, and module description for easy code discovery.
Still early stages:

### The idea:

The idea is to have a loose modular dependency system that does not rely on your modules being defined in any order, and will compile and resolve when all their dependencies are available. While easily facilitating the option for stricter control and accessibility between dependencies and modules that might depend on them.
This provides a loosely coupled module system that is easy to maintain and distribute.

And it's small. just ~6kb when minified

### documentation:

https://github.com/iamlothian/rucksack.js/blob/master/rucksack/README.md
