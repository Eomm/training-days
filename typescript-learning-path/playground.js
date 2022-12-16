"use strict";
var _a;
exports.__esModule = true;
var donut5_jpg_1 = require("https://github.com/FrontendMasters/grid-flexbox-v2/blob/main/day-2-grid/15-final-project/end/img/donut5.jpg");
console.log(donut5_jpg_1["default"]);
function add(n1, n2) {
    return n1 + n2;
}
console.log(add(1, 2));
var car = {
    name: "FIAT",
    year: 2019,
    voltage: 12
};
console.log(car.year);
var phones = {
    fax: {
        number: "123456789"
    }
};
console.log(phones.fax.number);
console.log((_a = phones.email) === null || _a === void 0 ? void 0 : _a.number);
function isCar(car) {
    return car.name !== undefined;
}
if (isCar({})) {
    console.log(car.name);
}
else {
    console.log("Not a car");
}
