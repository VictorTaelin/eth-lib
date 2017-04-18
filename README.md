## EthFP

Lightweight Ethereum libraries with strong emphasis in simplicity, efficiency, type consistency, purity and absolute modularity. It is heavily inspired by, and in many parts ported from [EthJS](https://github.com/ethjs), with some tweaks to: 

1. Eliminate some inefficiencies (ex: RLP dependency, which is currently bigger/slower than it could be);

2. Make the implementation a little bit closer to a pure functional programming style.

This will, hopefully, make function interfaces a little bit cleaner, unecessary format conversions less frequent, and minified .js builds faster and smaller. Moreover, it is a step in the direction of formalizing Ethereum on Coq, Idris, Agda or similar, which, in a future, could be used to analyze DApps and smart-contracts in type-theory for ultimate safety.
