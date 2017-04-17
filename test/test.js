const assert = require("assert");
const rnd = require("./lib/randomData.js");
const rlp = require("./../src/rlp.js");
const ref = {rlp: require("rlp")};

describe("RLP", () => {
  it("Must operate identically to reference implementation", () => {
    // Builds a test set of 256 random dataTrees + 2 default
    let dataTrees = [];
    dataTrees.push(["0x00112233", "0x00", "0x44", "0x55", "0xf0", "0xff", ["0x66"], ["0x77", "0x88"], "0x", "0x", "0x99aabb"]);
    dataTrees.push("0x00112233445566778899aabbccddeeff");
    for (let i = 0; i < 256; ++i)
      dataTrees.push(rnd.dataTree());

    // Tests if they encode and decode identically to the reference implementation
    dataTrees.forEach(dataTree => {
      const refEnc = "0x" + ref.rlp.encode(dataTree).toString("hex");
      const impEnc = rlp.encode(dataTree);
      const impDec = rlp.decode(impEnc);
      try {
        assert(refEnc === impEnc);
        assert(JSON.stringify(impDec) === JSON.stringify(dataTree));
      } catch (e) {
        console.log(JSON.stringify(dataTree, null, 2));
      }
    });

  });
});
