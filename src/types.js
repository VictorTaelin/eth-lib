const debug = require("./debug.js");
const hash = require("./hash.js");

let Type = [];

Type.check = (type, value) => {
  if (!type.test(value)) {
    const str = (() => {
      try { 
        return JSON.stringify(value);
      } catch (e) {
        return null;
      }
    })();
    throw new Error("\n" + debug.textBlock(100, 1, [
      debug.color(31, "EthFP type mismatch."),
      "--------------------------------------------------------------------------------------------------",
      " ",
      "An "+debug.color(34,"EthFP")+" function was expecting an argument of type " + debug.color(34,type.name) + ".",
      "It was incorrectly called with:",
      " ",
      str === null
        ? "  " + debug.color(34,"a non-JSON value (EthFP functions work only with JSON values)")
        : "  " + debug.color(34,str),
      " ",
      "The " + debug.color(34,type.name) + " type represents " + type.repr +".",
      " ",
      "It is encoded as " + type.form +". Ex:",
      " ",
      ].concat(type.samp.map(ex => "  " + debug.color(34,ex))).concat([
      " ",
      ])
    ));
  }
}

Type.Number = {
  name: "Number",
  repr: "a double-precision floating-point real numbers",
  form: "a plain JavaScript Number",
  test: value => typeof value === "number",
  samp: ['10', '2.5', '-4.2', '147']
}

Type.String = {
  name: "String",
  repr: "an UTF-8 string",
  form: "a plain JavaScript String",
  test: value => typeof value === "string",
  samp: ["\"foo\"", "\"the cake is real\"", "\"((λx.x x) (λx.x x))\"", "\"ಠ_ಠ\""]
}

Type.Data = {
  name: "Data",
  repr: "any arbitrary data",
  form: "a JavaScript String starting with a `0x`, followed by an even number of low-case hex chars (i.e., `0123456789abcdef`)",
  samp: ['0x', '0x42', '0x17b3ff01', '0xa3b8ff96cc3d716a7b69d21104aa'],
  test: value => typeof value === "string" && /^0x([0-9a-f][0-9a-f])*$/.test(value)
}

Type.BigNum = {
  name: "BigNum",
  repr: "an arbitrarily long non-negative integer number",
  samp: ['0x1', '0x2c7', '0x42f90dc4b80', '0x1337ff9e46'],
  form: "a JavaScript String starting with a `0x`, followed by at least one low-case hex char different from 0, followed by any number of low-case hex chars (i.e., `0123456789abcdef`)",
  test: value => typeof value === "string" && /^0x[1-9a-f]([0-9a-f])*$/.test(value)
}

Type.Array = type => ({
  name: "Array(" + type.name + ")",
  repr: "an array of " + type.name + "s",
  form: "a JavaScript Array of " + type.name + "s, where " + type.name + " is " + type.form,
  test: value => value instanceof Array && value.reduce((r,x) => r && type.test(x), true),
  samp: ['[]', '['+type.samp[3]+']', '['+type.samp[0]+', '+type.samp[2]+']', '['+type.samp[0]+', '+type.samp[1]+', '+type.samp[2]+', '+type.samp[3]+']']
})

Type.Struct = struct => {
  const fts = Object.keys(struct).map(field => [field, struct[field]]);
  return {
    name: "Struct({"+fts.map(([field,type]) => field + ":" + type.name).join(",")+"})",
    repr: "a struct with " + fts.map(([field,type]) => field + " (" + type.name + ")").join(", ") + "",
    form: "a JavaScript Object with the fields " + fts.map(([field,type]) => "\"" + field + "\"" + " (" + type.form + ")").join(", "),
    test: obj => fts.reduce((r,[field,type]) => r && type.test(obj[field]), true),
    samp: [0,1,2,3].map(i => "{"+fts.map(([field,type],j) => "\""+field+"\": "+type.samp[(i+j*31)%4]).join(", ")+"}")
  }
}

Type.FixedSizeData = bytes => ({
  name: "(FixedSizeData " + bytes + ")",
  repr: "any arbitrary data of exactly " + bytes + "-byte" + (bytes > 1 ? "s" : ""),
  form: "a JavaScript String starting with a `0x`, followed by " + (bytes * 2) + " low-case hex chars (i.e., `0123456789abcdef`)",
  test: value => Type.Data.test(value) && value.length === (bytes * 2 + 2),
  samp: ["0x" + debug.replicate(bytes, "01"), "0x" + debug.replicate(bytes, "3b"), "0x" + debug.replicate(bytes, "a7"), "0x" + debug.replicate(bytes, "ff")]
})

Type.Address = {
  name: "Address",
  repr: "an Ethereum public address",
  form: "a JavaScript String starting with a `0x`, followed by 40 hex chars (i.e., `0123456789abcdefABCDEF`), with the nth hex being uppercase iff the nth hex of the keccak256 of the lowercase address in ASCII is > 7",
  test: address => {
    // Base form: "0x" + 40 hex chars
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address))
      return false;
    // Checksum: nth letter should be upper if the nth hex of hash is > 7
    const addressHash = hash.keccak256(address.slice(2).toLowerCase());
    for (let i = 0; i < 40; i++)
      if (!/[0-9]/.test(address[i+2]) && parseInt(addressHash[i+2], 16) < 8 !== /[a-f]/.test(address[i+2]))
        return false;
    return true;
  },
  samp: ["0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf", "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF", "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69", "0x1efF47bc3a10a45D4B230B5d10E37751FE6AA718"]  
}

Type.PrivateKey = {
  name: "PrivateKey",
  repr: "an Ethereum private key",
  form: Type.FixedSizeData(32).form,
  test: Type.FixedSizeData(32).test,
  samp: Type.FixedSizeData(32).samp
}

Type.Account = (() => {
  const baseType = Type.Struct({
    address: Type.Address,
    privateKey: Type.PrivateKey,
  });
  return {
    name: "Account",
    repr: "an Ethereum account",
    form: baseType.form,
    test: baseType.test,
    samp: baseType.samp
  }
})();
