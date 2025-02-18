### jsonforged-tools

![npm](https://img.shields.io/npm/v/jsonforge-tools) ![License](https://img.shields.io/npm/l/jsonforge-tools) ![Downloads](https://img.shields.io/npm/dt/jsonforge-tools)

A powerful JSON utility that extends the capabilities of `JSON.stringify` and `JSON.parse`. `jsonforged-tools` handles circular references, `Infinity`, `null`, `Symbol`, and other edge cases seamlessly.

## 🚀 Features
- ✅ **Handles Circular References**  
- ✅ **Supports `Infinity`, `null`, and `Symbol` values**  
- ✅ **Improved serialization & deserialization**  
- ✅ **Preserves special data types**  
- ✅ **Better error handling**  

## 📦 Installation
```sh
npm install jsonforge-tools
```

## 🔧 Usage
### Import the package
```js
const { jsonStringify, jsonParse } = require('jsonforge-tools');
```

### Example
```js
const obj = { name: "test" };
obj.self = obj; // Circular reference

const jsonString = jsonStringify(obj);
console.log(jsonString);
// Output: {"name":"test","self":"[Circular]"}

const parsedObj = jsonParse(jsonString);
console.log(parsedObj);
// Output: { name: 'test', self: '[Circular]' }
```

## 🛠 API
### `jsonStringify(value, replacer, space)`
- Similar to `JSON.stringify` but handles circular references, `Infinity`, `Symbol`, etc.
- **Parameters:**  
  - `value` (Object): The object to serialize.  
  - `replacer` (Function, optional): Custom function to modify serialization.  
  - `space` (Number, optional): Indentation spaces for formatting.  
- **Returns:** JSON string.

### `jsonParse(jsonString, reviver)`
- Similar to `JSON.parse` but supports advanced parsing.  
- **Parameters:**  
  - `jsonString` (String): The JSON string to parse.  
  - `reviver` (Function, optional): Custom function to process parsed values.  
- **Returns:** JavaScript object.

## 📜 License
This project is licensed under the MIT License.

## 📬 Contact & Contribute
- GitHub: [jsonforge-tools](https://github.com/manan228/JSON)  
- Issues & PRs are welcome! 🎉  