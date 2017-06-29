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

  // Address, Address, ContractInterface -> Contract
  const contract = (from, address, interface) => {
    let contract = {};
    contract._address = address;
    contract._from = from;
    contract.broadcast = {};
    interface.forEach(method => {
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
          contract[method.name+"_pay"] = value => (...params) => call(true, value)(...params);
          contract[method.name+"_pay_txid"] = value => (...params) => call(false, value)(...params);
          contract[method.name+"_txid"] = call(false, "0x0");
        }
      }
    });
    return contract;
  }

  // Address, Bytecode -> Txid
  const deployBytecode_txid = (from, code) =>
    sendTransactionWithDefaults({from: from, data: code});

  // Address, Bytecode -> Receipt
  const deployBytecode = (from, code) =>
    deployBytecode_txid(from,code)
      .then(waitTransactionReceipt);

  // Address, Bytecode, ContractInterface
  const deployBytecodeContract = (from, code, interface) =>
    deployBytecode(from, code)
      .then(receipt => contract(from, receipt.contractAddress, interface));
      
  // Address, String, Address -> Contract
  const solidityContract = (from, source, at) =>
    compileSolidity(source)
      .then(({info:{abiDefinition}}) => contract(from, at, abiDefinition));

  // Address, String -> Txid
  const deploySolidity_txid = (from, source) =>
    compileSolidity(source)
      .then(({code}) => deployBytecode_txid(from, code));

  // Address, String -> Receipt
  const deploySolidity = (from, source) =>
    deploySolidity_txid(from, source)
      .then(waitTransactionReceipt);

  // Address, String -> Contract
  const deploySolidityContract = (from, source) =>
    compileSolidity(source)
      .then(({code, info:{abiDefinition}}) =>
        deployBytecodeContract(from, code, abiDefinition));

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
    deployBytecode_txid,
    deployBytecode,
    deployBytecodeContract,

    compileSolidity,
    solidityContract,
    deploySolidity_txid,
    deploySolidity,
    deploySolidityContract
  }
}

module.exports = Api;
