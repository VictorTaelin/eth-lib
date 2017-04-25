const A = require("./array.js");

const random = bytes => {
  let rnd;
  if (typeof window !== "undefined" && window.getRandomValues)
    rnd = window.getRandomValues(new Uint8Array(bytes));
  else if (typeof require !== "undefined")
    rnd = require("" + "crypto").randomBytes(bytes);
  else
    throw "Safe random numbers not available.";
  let hex = "0x";
  for (let i = 0; i < bytes; ++i)
    hex += ("00" + rnd[i].toString(16)).slice(-2);
  return hex;
};

const fromNumber = num => {
  let hex = num.toString(16);
  return hex.length % 2 === 0 ? "0x" + hex : "0x0" + hex ;
};

const toNumber = hex => 
  parseInt(hex.slice(2), 16);

const concat = (a, b) =>
  a.concat(b.slice(2));

const flatten = (a) =>
  "0x" + a.reduce((r,s) => r + s.slice(2), "");

const fromBN = bn =>
  bn.length % 2 === 0 ? bn : "0x0" + bn.slice(2);

const toBN = bn =>
  bn[2] === "0" ? "0x" + bn.slice(3) : bn;

module.exports = {
  random,
  concat,
  flatten,
  fromNumber,
  toNumber,
  fromBN,
  toBN
}
