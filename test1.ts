

let x = Bun.sleep(2000);
console.log("Hello!")
x = x.then(
    (r) => {
        console.log("Done counting to 2",r);
        return 'a';
    }
);
console.log("World!");
await Bun.sleep(2000);

console.log("Foo");

x = x.then(
    (r) => {
        console.log("Would this happen?>??",r);
        return 'b';
    }
);

await Bun.sleep(500);

x = x.then(
    (r) => {
        console.log("This hapens???",r)
        return 'c';
    }
);