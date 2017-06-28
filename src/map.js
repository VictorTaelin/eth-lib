const merge = a => b => {
  let c = {};
  for (let key in a)
    c[key] = a[key];
  for (let key in b)
    c[key] = b[key];
  return c;
}

module.exports = {
  merge
}
