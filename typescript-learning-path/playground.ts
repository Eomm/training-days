
import img from 'https://github.com/FrontendMasters/grid-flexbox-v2/blob/main/day-2-grid/15-final-project/end/img/donut5.jpg'

console.log(img);

function add(n1: number, n2: number) {
    return n1 + n2;
}

console.log(add(1, 2));

const car: {
  name: string;
  year: number;
  voltage?: number;
} = {
  name: "FIAT",
  year: 2019,
  voltage: 12,
}

console.log(car.year);

type Phone = {
  number: string;
  areaCode?: string;
  prefix?: number
}

const phones: {
  [k: string]: Phone | null
} = {
  fax: {
    number: "123456789"
  }
}

type stringProperties = keyof Phone & string;



console.log(phones.fax.number);
console.log(phones.email?.number);

function isCar(car: any): car is { name: string } {
  return car.name !== undefined;
}

if(isCar({})) {
  console.log(car.name);
} else {
  console.log("Not a car");
}

// infer type from function (webpack example)
// perfomance drawback here
type ReturnType<T> = T extends {
  new (arg: infer A, ...args: any[]): any
} ? A : never;

type PickWindowProp<
  Keys extends keyof Window
> = {
  [k in Keys]: Window[k]
}

type Foo = number | never; // never disappears

