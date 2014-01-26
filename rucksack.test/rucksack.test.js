/// <reference path="rucksack.test.config.js" />
/// <reference path="../rucksack/rucksack.min.js" />

describe("$rucksack", function () {
    it("exists", function () {
        expect(!!$rucksack).toBe(true);
    });
});

describe("$rucksack.$namespace", function () {

    var app = undefined;

    beforeEach(function () {
        
    });

    afterEach(function () {
        app = undefined;
        $rucksack.$reset();
    });

    it("can create new a namespace", function () {
        app = $rucksack.$namespace("APP");
        expect(!!app).toBe(true);
    });
    it("can create new a sealed namespace", function () {
        app = $rucksack.$namespace("APP", { sealed:true });
        expect(!!app).toBe(true);
    });
    it("throws an exception on duplicate namespace", function () {
        app = $rucksack.$namespace("APP");
        var error = function () { $rucksack.$namespace("APP"); }
        expect(error).toThrow();
    });

});

describe("$namespace.$service", function () {

    var app = undefined;

    beforeEach(function () {
        app = $rucksack.$namespace("APP");
    });

    afterEach(function () {
        app = undefined;
        $rucksack.$reset();
    });

    it("can create a new stand alone service", function () {

        var listener = jasmine.createSpy('s1 listener');
        $rucksack.$await("waitFors1", ['APP:s1', listener]);

        app.$service('s1', [function () {
            this.propery = 10;
        }]);

        expect(listener).toHaveBeenCalledWith({propery:10});
    });

    it("can create a new dependent service", function () {

        var listener = jasmine.createSpy('s1 listener');
        $rucksack.$await("waitFors1", ['APP:s2', listener]);

        app.$service('s1', [function () {
            this.p1 = 's1';
        }]);

        app.$service('s2', ['APP:s1', function (s1) {
            this.p1 = s1.p1;
            this.p2 = 's2';
        }]);

        

        expect(listener).toHaveBeenCalledWith({ p1: 's1', p2:'s2'});
    });

});
