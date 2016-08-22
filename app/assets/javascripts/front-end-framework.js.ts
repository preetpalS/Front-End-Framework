
var adder = function(num) {
    return function(val) { return val + num; };
};

namespace FrontEndFramework {
    export var VERSION = '1.0.0';

    export var adder = function(num: number) {
        return function(val: number) { return val + num; };
    };
}

