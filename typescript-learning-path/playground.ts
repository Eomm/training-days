

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

const phones: {
  [k: string]: {
    number: string;
  } | null
} = {
  fax: {
    number: "123456789"
  }
}

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