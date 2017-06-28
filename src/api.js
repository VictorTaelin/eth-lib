const Api = provider => {
  const Nat = require("./nat");
  const Map = require("./map");
  const Bytes = require("./bytes");
  const keccak256s = require("./hash").keccak256s;
  const send = method => (...params) =>
    new Promise((resolve,reject) =>
      provider.send(method, params, (err, result) =>
        err ? reject(err) : resolve(result)));

  const sendTransaction = send("eth_sendTransaction");
  const sendRawTransaction = send("eth_sendRawTransaction");
  const getTransactionReceipt = send("eth_getTransactionReceipt");
  const compileSolidity = send("eth_compileSolidity");
  const call = send("eth_call");
  const getBalance = send("eth_getBalance");
  const accounts = send("eth_accounts");

  const waitTransactionReceipt = getTransactionReceipt; // TODO: implement correctly

  const addTransactionDefaults = tx =>
    Promise.all([
      tx.chainId || send("net_version")(),
      tx.gasPrice || send("eth_gasPrice")(),
      tx.nonce || send("eth_getTransactionCount")(tx.from,"latest"),
      tx.value || "0x0",
      tx.data || "0x"])
    .then(([chainId, gasPrice, nonce, value, data]) =>
      Map.merge(tx)({chainId: "0x"+chainId, gasPrice, nonce, value, data}))
    .then(tx =>
      send("eth_estimateGas")(tx)
        .then(usedGas => Map.merge(tx)({
          gasPrice: Nat.div(Nat.mul(tx.gasPrice,"0x30"),"0x5"),
          gas: Nat.div(Nat.mul(usedGas,"0x30"),"0x5")
        })))

  const sendTransactionWithDefaults = tx =>
    addTransactionDefaults(tx)
      .then(sendTransaction);

  const callWithDefaults = (tx, block) =>
    addTransactionDefaults(tx)
      .then(tx => call(tx, block || "latest"));

  const callMethodData = method => (...params) => {
    const methodSig = method.name + "(" + method.inputs.map(i => i.type).join(",") + ")";
    return Bytes.concat(keccak256s(methodSig).slice(0,10), Bytes.flatten(params));
  }

  const contract = (from, address, abi) => {
    let contract = {};
    contract._address = address;
    contract._from = from;
    contract.broadcast = {};
    abi.forEach(method => {
      if (method && method.name) {
        const call = (waitReceipt, value) => (...params) => {
          const transaction = {
            from: from,
            to: address,
            value: value,
            data: callMethodData(method)(...params.map(p => Bytes.pad(32,p)))
          };
          return method.constant
            ? callWithDefaults(transaction)
            : sendTransactionWithDefaults(transaction)
              .then(waitReceipt ? waitTransactionReceipt : (x => x));
        };
        contract[method.name] = call(true, "0x0");
        if (!method.constant) {
          contract[method.name+"$"] = (value, ...params) => call(true, value)(...params);
          contract.broadcast[method.name+"$"] = (value, ...params) => call(false, value)(...params);
          contract.broadcast[method.name] = call(false, "0x0");
        }
      }
    });
    return contract;
  }

  const solidityCodeAndAbi = source =>
    compileSolidity(source)
      .then(comp => ({
        code: comp.code,
        abi: comp.info.abiDefinition
      }));

  const solidityContract = (from, source, at) =>
    solidityCodeAndAbi(source)
      .then(({abi}) => contract(from, at, abi));

  const deployCode_ = (from, code) =>
    sendTransactionWithDefaults({from: from, data: code});

  const deployCode = (from, code) =>
    deplyoCode_(from,code)
      .then(waitTransactionReceipt);

  const deploySolidity_ = (from, source) =>
    solidityCodeAndAbi(source)
      .then(({code}) => deployCode_(from, code));

  const deploySolidity = (from, source) =>
    deploySolidity_(from, source)
      .then(waitTransactionReceipt);

  const deploySolidityContract = (from, source) =>
    deploySolidity(from, source)
      .then(receipt => contract(from, receipt.contractAddress, abi));

  return {
    send,

    sendTransaction,
    sendRawTransaction,
    getTransactionReceipt,
    compileSolidity,
    call,
    getBalance,
    accounts,

    waitTransactionReceipt,
    addTransactionDefaults,
    sendTransactionWithDefaults,
    callWithDefaults,
    callMethodData,
    contract,
    solidityCodeAndAbi,
    solidityContract,
    deployCode_,
    deployCode,
    deploySolidity_,
    deploySolidity,
    deploySolidityContract
  }
}

module.exports = Api;
