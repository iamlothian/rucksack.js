/// <reference path="../rucksack/rucksack.min.js" />

describe("$rucksack", function () {
    it("exists", function () {
        expect(!!$rucksack).toBe(true);
    });
});

describe("$rucksack.$namespace(\"APP\")", function () {

    var app = $rucksack.$namespace("APP");

    it("created", function () {
        expect(!!app).toBe(true);
    });
    it("can't be created twice", function () {
        var error = function () { $rucksack.$namespace("APP"); }
        expect(error).toThrow();
    });


});
