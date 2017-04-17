## EthFP

Lightweight Ethereum libraries with strong emphasis in simplicity, efficiency, type consistency, purity and absolute modularity. It is heavily inspired by, and in many parts ported from [EthJS](https://github.com/ethjs), with some tweaks to: 

1. Eliminate some inefficiencies (ex: RLP dependency, which is currently bigger/slower than it could be);

2. Make the implementation a little bit closer to a pure functional programming style.

This will, hopefully, make function interfaces a little bit cleaner, unecessary format conversions less frequent, and minified .js builds faster and smaller. Moreover, it is a step in the direction of formalizing Ethereum on Coq, Idris, Agda or similar, which, in a future, could be used to analyze DApps and smart-contracts in type-theory for ultimate safety.

## Modules

This documents all exported modules. All those types are specified on the next section.

```Haskell
rlp.encode 
  :: DataTree  -- Data to be serialized 
  -> HexString -- Serialized string

rlp.decode
  :: HexString -- String to be deserialized
  -> DataTree  -- Deserialized string

account.create
  :: HexString -- Extra source of entropy
  ~> Account   -- Generated account

account.fromPrivate
  :: BoundedHexString 32 -- 32-byte HexString
  -> Account             -- Generated account

account.sign
  :: HexString -- data
  -> Account   -- private key
  -> Number    -- chain ID
  -> Signature -- signature

(...)
```

TODO: that documentation will be moved to the files themselves. Each exported function will be wrapped with a high-level decoration which will document each argument's type and details. This will be used to generate a documentation, provide consistent runtime errors, etc.

## Types

This documents every used type.

#### Number:

- Plain JavaScript, IEEE 754 compliant number.

#### String:

- Plain JavaScript UTF-16 String.

#### HexString:

- An arbitrary-length byte-string. Conceptually: `data ByteString = 00 ByteString | 01 ByteString | ... | FF ByteString | End`.

- This is the universal format to represent arbitrary data in function interfaces. Buffers / Uint8Array aren't used (only internally).

- Represented as a JavaScript String starting with a `0x`, followed by an even number of low-case hex chars (i.e., `0123456789abcdef`).

- Anything that matches the Regex `/^0x([0-9a-f][0-9a-f])*$/`.

- Those aren't valid HexStrings: `d5fab3` (doesn't start with `0x`), `0x0` (non-even char count).

- Examples:

```javascript
const a = "0x";         // the empty, 0-bytes string
const a = "0x0000";     // the [0, 0], 2-bytes string
const b = "0x00010203"; // the [0, 1, 2, 3], 4-bytes string
const c = "0xf0f1f2f3"; // the [240, 241, 242, 242], 4-bytes string
```

#### HexNumber:

- An arbitrary-length natural number. Conceptually: `data Nat = Zero | Succ Nat`.

- This is the universal format to represent big numbers in function interfaces. BigNum instances aren't used (only internally).

- Represented as a JavaScript String starting with a `0x`, followed by a positive integer number of low-case hex chars (i.e., `0123456789abcdef`).

- Anything that matches the Regex `/^0x[1-9a-f]([0-9a-f])*$/`.

- Those aren't valid HexNumbers: `0x` (empty), `0x01` (leading zero).

- Examples:

```javascript
const a = "0x1";   // number 1
const b = "0xf";   // number 15
const c = "0x10";  // number 16
const d = "0xff";  // number 255
const e = "0x100"; // number 256
```

#### DataTree:

- A tree of byte-strings. Conceptually: `data DataTree = Leaf HexString | Node (Array DataTree)`.

- Represented as a tree of nested JavaScript arrays of HexStrings.

- Serialized/deserialized to/from `HexString` with the `rlp.js` library.

- Examples:

```javascript
const a = ["0xabcd", ["0x0102", "0x42"], "0x", "0xaabbcc", ["0x00", "0xff"]]`;
const b = "0x010203aabbcc";
const c = ["0x01", "0x02", "0x03", "0x04"];
```

#### Account:

- An alias for:

```
type Account = {
  privateKey: String,
  publicKey: String,
  address: String
}
```

- Examples:

```javascript
...
```

#### Signature:

```javascript
...
```

TODO: those specs will be moved to a `types.js` file which will include documentations and checking functions.
