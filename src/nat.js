const BN = require("BN.js");
const Bytes = require("./bytes");

const fromBN = bn =>
  "0x" + bn.toString("hex");

const toBN = str =>
  new BN(str.slice(2), 16);

const fromString = str => {
  const bn = "0x" + (str.slice(0,2) === "0x"
    ? new BN(str.slice(2), 16)
    : new BN(str, 10)).toString("hex");
  return bn === "0x0" ? "0x" : bn;
}

const fromNumber = a =>
  "0x" + new BN(a).toString("hex");

const toNumber = a =>
  toBN(a).toNumber();

const toUint256 = a =>
  Bytes.pad(32, a);

const bin = method => (a, b) =>
  fromBN(toBN(a)[method](toBN(b)));

const add = bin("add");
const mul = bin("mul");
const div = bin("div");
const sub = bin("sub");

module.exports = {
  fromString,
  toNumber,
  fromNumber,
  toUint256,
  add,
  mul,
  div,
  sub
}
