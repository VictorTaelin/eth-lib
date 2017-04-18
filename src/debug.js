// TODO: move to a proper library
const replicate = (num, str) => {
  let s = "";
  for (var i = 0; i < num; ++i)
    s = s + str;
  return s;
}

const color = (num, str) =>
  "\x1b[" + num + "m" + str + "\x1b[0m";

const plainLength = (str) =>
  str.replace(/\x1b\[\d*m/g, "").length;

const textBlock = (width, pad, blocks) => {
  const head = "," + replicate(width,"_") + ",";
  const foot = "|" + replicate(width,"_") + "|";
  const body = blocks
    .map((str) => {
      let lines = [];
      let line = "";
      for (var i = 0; i < str.length; ++i) {
        line += str[i];
        if (plainLength(line) === width - pad * 2) {
          lines.push(line);
          line = "";
        };
      }
      if (plainLength(line) > 0) {
        while (plainLength(line) < width - pad * 2)
          line += " ";
        lines.push(line);
      };
      return lines.map(line => "|" + replicate(pad," ") + line + replicate(pad," ") + "|").join("\n");
    })
    .join("\n");
  return head + "\n" + body + "\n" + foot;
}

const callsPerSecond = fn => {
  for (var i = 0, t = Date.now(); Date.now() - t < 500; ++i)
    fn();
  return i * 2;
}

module.exports = {
  color,
  plainLength,
  textBlock,
  replicate,
  callsPerSecond
}
