class JSONStringifier {
  static isBoolean(value) {
    return typeof value === "boolean";
  }

  static isString(value) {
    return typeof value === "string";
  }

  static isNumber(value) {
    return typeof value === "number";
  }

  static isBigint(value) {
    return typeof value === "bigint";
  }

  static isArray(value) {
    return Array.isArray(value) && typeof value === "object";
  }

  static isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  static isSymbol(value) {
    return typeof value === "symbol";
  }

  static isNull(value) {
    return value === null && typeof value === "object";
  }

  static isInfinity(value) {
    return typeof value === "number" && !isFinite(value);
  }

  static isUndefined(value) {
    return value === undefined && typeof value === "undefined";
  }

  static isDate(value) {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof value.getMonth === "function"
    );
  }

  static isFunction(value) {
    return typeof value === "function";
  }

  static escapeString(str) {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")
      .replace(/\r/g, "\\r")
      .replace(/[\b]/g, "\\b")
      .replace(/\f/g, "\\f");
  }

  static stringify(obj) {
    if (this.isFunction(obj)) {
      return `${obj}`;
    }

    if (this.isDate(obj)) {
      return `"${obj.toISOString()}"`;
    }

    if (this.isNumber(obj)) {
      return `${obj}`;
    }

    if (this.isBoolean(obj)) {
      return `${obj}`;
    }

    if (this.isString(obj)) {
      return `"${this.escapeString(obj)}"`;
    }

    if (this.isBigint(obj)) {
      return `${obj}n`;
    }

    if (this.isSymbol(obj)) {
      return `${obj.toString()}`;
    }

    if (this.isNull(obj)) {
      return `${null}`;
    }

    if (this.isInfinity(obj)) {
      return `${obj}`;
    }

    if (this.isUndefined(obj)) {
      return `${obj}`;
    }

    if (this.isArray(obj)) {
      let arrStr = obj.map((eachValue) => this.stringify(eachValue)).join(",");
      return `[${arrStr}]`;
    }

    if (this.isObject(obj)) {
      let objStr = Object.keys(obj)
        .map((eachKey) => `"${eachKey}":${this.stringify(obj[eachKey])}`)
        .join(",");
      return `{${objStr}}`;
    }
  }
}

class JSONParser {
  constructor(jsonString) {
    this.jsonString = jsonString.trim();
    this.position = 0;
    this.seenObjects = new WeakSet();
  }

  parse() {
    const result = this.parseValue();
    this.skipWhitespace();

    if (this.position !== this.jsonString.length) {
      throw new Error("Unexpected characters at the end of JSON");
    }

    return result;
  }

  parseValue() {
    this.skipWhitespace();
    if (this.match("null")) return null;
    if (this.match("true")) return true;
    if (this.match("false")) return false;
    if (this.peek() === '"') {
      let strValue = this.parseString();

      if (/^\d+n$/.test(strValue)) {
        return BigInt(strValue.slice(0, -1));
      }
      return strValue;
    }
    if (this.peek() === "{") return this.parseObject();
    if (this.peek() === "[") return this.parseArray();
    if (this.isDigit(this.peek()) || this.peek() === "-")
      return this.parseNumber();
    throw new Error(
      `Unexpected token '${this.peek()}' at position ${this.position}`
    );
  }

  parseString() {
    let result = "";
    this.position++;

    while (this.position < this.jsonString.length) {
      let char = this.jsonString[this.position++];
      if (char === '"') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result)) {
          return new Date(result);
        }
        return result;
      }
      if (char === "\\") {
        if (this.position >= this.jsonString.length) {
          throw new Error("Unterminated escape sequence");
        }
        char = this.jsonString[this.position++];
        switch (char) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "/":
            result += "/";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "u":
            if (this.position + 4 > this.jsonString.length) {
              throw new Error("Invalid Unicode escape sequence");
            }
            const hex = this.jsonString.substr(this.position, 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new Error("Invalid Unicode escape sequence");
            }
            result += String.fromCharCode(parseInt(hex, 16));
            this.position += 4;
            break;
          default:
            throw new Error(`Invalid escape sequence \${char}`);
        }
      } else {
        result += char;
      }
    }

    throw new Error("Unterminated string");
  }

  parseNumber() {
    let numberStr = "";

    while (
      this.position < this.jsonString.length &&
      /[0-9eE+\-.]/.test(this.peek())
    ) {
      numberStr += this.jsonString[this.position++];
    }

    if (numberStr.endsWith("n")) {
      return BigInt(numberStr.slice(0, -1));
    }

    const number = Number(numberStr);

    if (!Number.isSafeInteger(number) && /^[0-9]+$/.test(numberStr)) {
      return BigInt(numberStr);
    }

    if (isNaN(number)) {
      throw new Error("Invalid number");
    }

    return number;
  }

  parseArray(depth = 0) {
    if (depth > 1000) {
      // Prevents stack overflow
      throw new Error("Too deeply nested array");
    }

    this.position++;
    const result = [];
    this.skipWhitespace();

    if (this.peek() === "]") {
      this.position++;
      return result;
    }

    while (this.position < this.jsonString.length) {
      result.push(this.parseValue(depth + 1));
      this.skipWhitespace();

      if (this.peek() === "]") {
        this.position++;
        return result;
      }

      if (this.peek() !== ",") {
        throw new Error("Expected ',' in array");
      }

      this.position++;
    }

    throw new Error("Unterminated array");
  }

  parseObject() {
    this.position++;
    const result = {};

    this.skipWhitespace();
    if (this.peek() === "}") {
      this.position++;
      return result;
    }

    while (this.position < this.jsonString.length) {
      this.skipWhitespace();

      if (this.peek() !== '"') {
        throw new Error("Expected string key");
      }

      const key = this.parseString();
      this.skipWhitespace();

      if (this.peek() !== ":") {
        throw new Error("Expected ':' after key");
      }

      this.position++;

      const value = this.parseValue();

      if (typeof value === "object" && value !== null) {
        if (this.seenObjects.has(value)) {
          throw new Error("Circular reference detected");
        }
        this.seenObjects.add(value);
      }

      result[key] = value;
      this.skipWhitespace();

      if (this.peek() === "}") {
        this.position++;
        return result;
      }

      if (this.peek() !== ",") {
        throw new Error("Expected ',' in object");
      }

      this.position++;
    }

    throw new Error("Unterminated object");
  }

  skipWhitespace() {
    while (this.position < this.jsonString.length && /\s/.test(this.peek())) {
      this.position++;
    }
  }

  match(str) {
    if (this.jsonString.startsWith(str, this.position)) {
      this.position += str.length;
      return true;
    }

    return false;
  }

  peek() {
    return this.jsonString[this.position];
  }

  isDigit(char) {
    return char >= "0" && char <= "9";
  }
}

module.exports = { JSONParser, JSONStringifier };