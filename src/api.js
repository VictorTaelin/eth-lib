const Api = provider => {
  const Nat = require("./nat");
  const Obj = require("fpl/object");
  const Bytes = require("./bytes");
  const keccak256s = require("./hash").keccak256s;

  const send = method => (...params) =>
    new Promise((resolve, reject) =>
      provider.send(method, params, (err, result) =>
        err ? reject(err) : resolve(result)));

  const sendTransaction = send("eth_sendTransaction");
  const sendRawTransaction = send("eth_sendRawTransaction");
  const getTransactionReceipt = send("eth_getTransactionReceipt");
  const compileSolidity = send("eth_compileSolidity");
  const call = send("eth_call");

  const addTransactionDefaults = tx =>
    Promise.all([
      tx.chainId || send("net_version")(),
      tx.gasPrice || send("eth_gasPrice")(),
      tx.nonce || send("eth_getTransactionCount")(tx.from),
      tx.value || "0x",
      tx.data || "0x"])
    .then(([chainId, gasPrice, nonce, value, data]) =>
      Obj.merge(tx)({chainId, gasPrice, nonce, value, data}))
    .then(tx =>
      send("eth_estimateGas")(tx)
        .then(usedGas => Obj.merge(tx)({
          gasLimit: Nat.div(Nat.mul(usedGas,"0x6"),"0x5")
        })));

  const sendTransactionWithDefaults = tx =>
    addTransactionDefaults(tx)
      .then(sendTransaction);

  const callWithDefaults = tx =>
    addTransactionDefaults(tx)
      .then(call);

  const callMethodData = method => (...params) => {
    const methodSig = method.name + "(" + method.inputs.map(i => i.type).join(",") + ")";
    return Bytes.concat(keccak256s(methodSig).slice(0,10), Bytes.flatten(params));
  }

  const contract = (from, address, abi) => {
    let contract = {};
    contract._address = address;
    contract._from = from;
    abi.forEach(method =>
      contract[method.name] = (...params) => 
        (method.constant ? callWithDefaults : sendTransactionWithDefaults)
        ({from: from, to: address, data: callMethodData(method)(...params)}));
    return contract;
  }

  const solidityCodeAndAbi = source =>
    compileSolidity(source)
      .then(comp => ({
        code: comp.code,
        abi: comp.info.abiDefinition
      }));

  const deployCode = (from, code) =>
    sendTransactionWithDefaults({from: from, data: code});

  const deploySolidity = (from, source) =>
    solidityCodeAndAbi(source).then(({_,code}) => deployCode(from, code));

  const deploySolidityContract = (from, source) =>
    solidityCodeAndAbi(source)
      .then(({abi,code}) =>
        sendTransactionWithDefaults({from: from, data: code})
          .then(getTransactionReceipt)
          .then(receipt => contract(from, receipt.contractAddress, abi)));

  return {
    send,
    sendTransaction,
    sendTransactionWithDefaults,
    sendRawTransaction,
    getTransactionReceipt,
    addTransactionDefaults,
    callWithDefaults,
    compileSolidity,
    solidityCodeAndAbi,
    deployCode,
    deploySolidity,
    deploySolidityContract,
    callMethodData,
    call,
    contract,
  }
}

module.exports = Api;
