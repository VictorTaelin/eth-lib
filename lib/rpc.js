var request = require("xhr-request-promise");

var genPayload = function () {
  var nextId = 0;
  return function (method, params) {
    return {
      jsonrpc: "2.0",
      id: ++nextId,
      method: method,
      params: params
    };
  };
}();

var send = function send(url) {
  return async function (method, params) {
    try {
      var answer = await request(url, {
        method: "POST",
        contentType: "application/json-rpc",
        body: JSON.stringify(genPayload(method, params)) });
      var resp = JSON.parse(answer); // todo: use njsp?
      if (resp.error) {
        throw new Error(resp.error.message);
      } else {
        return resp.result;
      }
    } catch (e) {
      return { error: e.toString() };
    }
  };
};

module.exports = send;