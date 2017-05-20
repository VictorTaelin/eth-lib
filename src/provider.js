const njsp = require("nano-json-stream-parser");

const EthereumProvider = url => {
  let api = {};
  let onResponse = {}; 
  let callbacks = {};
  let nextId = 0;

  const parseResponse = njsp(json => {
    onResponse[json.id] && onResponse[json.id](null, json.result);
  });

  const genPayload = (method, params) => ({
    jsonrpc: "2.0",
    id: ++nextId,
    method: method,
    params: params
  });

  api.on = (name, callback) => {
    callbacks[name] = callback;
  }

  if (/^ws/.test(url)) {
    const WebSocket = require("ws");
    const ws = new WebSocket(url);
    api.send = (method, params, callback) => {
      const payload = genPayload(method, params);
      onResponse[payload.id] = callback;
      ws.send(JSON.stringify(payload));
    }
    ws.on("message", parseResponse);
    ws.on("open", () => callbacks.connect && callbacks.connect(eth));
    ws.on("close", () => callbacks.disconnect && callbacks.disconnect());
    
  } else if (/^http/.test(url)) {
    const rw = require("reqwest");

    api.send = (method, params, callback) => {
      rw({
        url: url,
        method: "post",
        contentType: "application/json-rpc",
        data: JSON.stringify(genPayload(method,params))})
        .then(resp => {
          if (resp.error) {
            callback(resp.error.message);
          } else {
            callback(null, resp.result)
          }
        })
        .catch(err => callback("Couldn't connect to Ethereum node."));
    }

    setTimeout(() => {
      callbacks.connect && callbacks.connect();
    }, 1);

  } else {
    throw "IPC not supported yet.";
  }

  return api;
};

module.exports = EthereumProvider;
