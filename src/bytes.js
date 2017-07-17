const A = require("./array.js");

const random = bytes => {
  let rnd;
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues)
    rnd = window.crypto.getRandomValues(new Uint8Array(bytes));
  else if (typeof require !== "undefined")
    rnd = require("c" + "rypto").randomBytes(bytes);
  else
    throw "Safe random numbers not available.";
  let hex = "0x";
  for (let i = 0; i < bytes; ++i)
    hex += ("00" + rnd[i].toString(16)).slice(-2);
  return hex;
};

const toArray = hex => {
  let arr = [];
  for (let i = 2, l = hex.length; i < l; i += 2)
    arr.push(parseInt(hex.slice(i, i + 2), 16));
  return arr;
}

const fromArray = arr => 
  "0x" + arr.map(b => ("00" + b.toString(16)).slice(-2)).join("");

const fromNumber = num => {
  let hex = num.toString(16);
  return hex.length % 2 === 0 ? "0x" + hex : "0x0" + hex ;
};

const fromAscii = ascii => {
  let hex = "0x";
  for (let i = 0; i < ascii.length; ++i)
    hex += ("00" + ascii.charCodeAt(i).toString(16)).slice(-2);
  return hex;
};

const toAscii = hex => {
  let ascii = "";
  for (let i = 2; i < hex.length; i += 2)
    ascii += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return ascii;
};

const toNumber = hex => 
  parseInt(hex.slice(2), 16);

const length = a =>
  (a.length - 2) / 2;

const concat = (a, b) =>
  a.concat(b.slice(2));

const flatten = (a) =>
  "0x" + a.reduce((r,s) => r + s.slice(2), "");

const slice = (i,j,bs) =>
  "0x" + bs.slice(i*2+2,j*2+2);

const pad = (l,hex) =>
  hex.length === l*2+2 ? hex : pad(l,"0x"+"0"+hex.slice(2));

const padRight = (l,hex) =>
  hex.length === l*2+2 ? hex : padRight(l,hex+"0");

const fromNat = bn =>
  bn === "0x0" ? "0x" : bn.length % 2 === 0 ? bn : "0x0" + bn.slice(2);

const toNat = bn =>
  bn[2] === "0" ? "0x" + bn.slice(3) : bn;

module.exports = {
  random,
  length,
  concat,
  flatten,
  slice,
  pad,
  padRight,
  fromAscii,
  toAscii,
  fromNumber,
  toNumber,
  fromNat,
  toNat,
  fromArray,
  toArray
}
