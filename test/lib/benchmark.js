const rnd = require("./randomData.js");
const rlp = require("./../../src/rlp.js");
const ref = {rlp: require("rlp")};
const cps = f => {
  for (var t = Date.now(), i = 0; Date.now() - t < 1000; ++i)
    f();
  return i;
};

let dataTrees = [];
for (let i = 0; i < 64; ++i)
  dataTrees.push(rnd.dataTree());
console.log("Benchmarking Mist-lite's RLP implementation vs the one on NPM.");
const liteCps = cps(() => dataTrees.map((dt) => rlp.decode(rlp.encode(dt))));
const npmCps = cps(() => dataTrees.map((dt) => ref.rlp.decode(ref.rlp.encode(dt))));
console.log("- Mist Lite: " + liteCps + " calls per second.");
console.log("- Reference: " + npmCps + " calls per second.");
console.log("- Mist Lite is: " + (liteCps / npmCps).toFixed(2) + " " + (liteCps > npmCps ? "faster" : "slower") + " than reference.");
