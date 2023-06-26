!function(factory) {
    var global = this || window.global || window;
    "object" == typeof exports ? module.exports = factory(global) : "function" == typeof define && define.amd ? define([], function() {
        return factory(global);
    }) : global.jDataView = factory(global);
}(function(global) {
    "use strict";
    var context2d, createPixelData, compatibility = {
        NodeBuffer: "Buffer" in global,
        DataView: "DataView" in global,
        ArrayBuffer: "ArrayBuffer" in global,
        PixelData: "CanvasPixelArray" in global && !("Uint8ClampedArray" in global) && "document" in global
    }, TextEncoder = global.TextEncoder, TextDecoder = global.TextDecoder;
    compatibility.NodeBuffer && function(buffer) {
        try {
            buffer.writeFloatLE(1 / 0, 0);
        } catch (e) {
            compatibility.NodeBuffer = !1;
        }
    }(new Buffer(4)), compatibility.PixelData && (context2d = document.createElement("canvas").getContext("2d"), 
    createPixelData = function(byteLength, buffer) {
        var data = context2d.createImageData((byteLength + 3) / 4, 1).data;
        if (data.byteLength = byteLength, void 0 !== buffer) for (var i = 0; i < byteLength; i++) data[i] = buffer[i];
        return data;
    });
    var dataTypes = {
        Int8: 1,
        Int16: 2,
        Int32: 4,
        Uint8: 1,
        Uint16: 2,
        Uint32: 4,
        Float32: 4,
        Float64: 8
    };
    function is(obj, Ctor) {
        return "object" == typeof obj && null !== obj && (obj.constructor === Ctor || Object.prototype.toString.call(obj) === "[object " + Ctor.name + "]");
    }
    function arrayFrom(arrayLike, forceCopy) {
        return !forceCopy && is(arrayLike, Array) ? arrayLike : Array.prototype.slice.call(arrayLike);
    }
    function defined(value, defaultValue) {
        return void 0 !== value ? value : defaultValue;
    }
    function jDataView(buffer, byteOffset, byteLength, bufferLength) {
        if (jDataView.is(buffer)) {
            var result = buffer.slice(byteOffset, byteOffset + byteLength);
            return result._littleEndian = defined(bufferLength, result._littleEndian), result;
        }
        if (!jDataView.is(this)) return new jDataView(buffer, byteOffset, byteLength, bufferLength);
        if (this.buffer = buffer = jDataView.wrapBuffer(buffer), this._isArrayBuffer = compatibility.ArrayBuffer && is(buffer, ArrayBuffer), 
        this._isPixelData = compatibility.PixelData && is(buffer, CanvasPixelArray), this._isDataView = compatibility.DataView && this._isArrayBuffer, 
        this._isNodeBuffer = compatibility.NodeBuffer && Buffer.isBuffer(buffer), !(this._isNodeBuffer || this._isArrayBuffer || this._isPixelData || is(buffer, Array))) throw new TypeError("jDataView buffer has an incompatible type");
        this._littleEndian = !!bufferLength;
        bufferLength = "byteLength" in buffer ? buffer.byteLength : buffer.length;
        this.byteOffset = byteOffset = defined(byteOffset, 0), this.byteLength = byteLength = defined(byteLength, bufferLength - byteOffset), 
        this._offset = this._bitOffset = 0, this._isDataView ? this._view = new DataView(buffer, byteOffset, byteLength) : this._checkBounds(byteOffset, byteLength, bufferLength), 
        this._engineAction = this._isDataView ? this._dataViewAction : this._isNodeBuffer ? this._nodeBufferAction : this._isArrayBuffer ? this._arrayBufferAction : this._arrayAction;
    }
    function getCharCodes(string) {
        if (compatibility.NodeBuffer) return new Buffer(string, "binary");
        for (var codes = new (compatibility.ArrayBuffer ? Uint8Array : Array)(string.length), i = 0, length = string.length; i < length; i++) codes[i] = 255 & string.charCodeAt(i);
        return codes;
    }
    function pow2(n) {
        return 0 <= n && n < 31 ? 1 << n : pow2[n] || (pow2[n] = Math.pow(2, n));
    }
    function Uint64(lo, hi) {
        this.lo = lo, this.hi = hi;
    }
    function Int64(lo, hi) {
        Uint64.apply(this, arguments);
    }
    function numToDigits(num) {
        for (var digits = num.toString().split(""), i = 0; i < digits.length; i++) digits[i] = +digits[i];
        return digits.reverse(), digits;
    }
    function add(x, y) {
        for (var z = [], n = Math.max(x.length, y.length), carry = 0, i = 0; i < n || carry; ) {
            var zi = carry + (i < x.length ? x[i] : 0) + (i < y.length ? y[i] : 0);
            z.push(zi % 10), carry = Math.floor(zi / 10), i++;
        }
        return z;
    }
    jDataView.wrapBuffer = function(buffer) {
        switch (typeof buffer) {
          case "number":
            if (compatibility.NodeBuffer) (buffer = new Buffer(buffer)).fill(0); else if (compatibility.ArrayBuffer) buffer = new Uint8Array(buffer).buffer; else if (compatibility.PixelData) buffer = createPixelData(buffer); else {
                buffer = new Array(buffer);
                for (var i = 0; i < buffer.length; i++) buffer[i] = 0;
            }
            return buffer;

          case "string":
            buffer = getCharCodes(buffer);

          default:
            return "length" in buffer && !(compatibility.NodeBuffer && Buffer.isBuffer(buffer) || compatibility.ArrayBuffer && is(buffer, ArrayBuffer) || compatibility.PixelData && is(buffer, CanvasPixelArray)) && (compatibility.NodeBuffer ? buffer = new Buffer(buffer) : compatibility.ArrayBuffer ? is(buffer, ArrayBuffer) || is(buffer = new Uint8Array(buffer).buffer, ArrayBuffer) || (buffer = new Uint8Array(arrayFrom(buffer, !0)).buffer) : buffer = compatibility.PixelData ? createPixelData(buffer.length, buffer) : arrayFrom(buffer)), 
            buffer;
        }
    }, jDataView.is = function(view) {
        return view && view.jDataView;
    }, jDataView.from = function() {
        return new jDataView(arguments);
    }, (jDataView.Uint64 = Uint64).prototype.valueOf = function() {
        return this.lo + pow2(32) * this.hi;
    }, Uint64.fromNumber = function(number) {
        var hi = Math.floor(number / pow2(32));
        return new Uint64(number - hi * pow2(32), hi);
    }, ((jDataView.Int64 = Int64).prototype = "create" in Object ? Object.create(Uint64.prototype) : new Uint64()).valueOf = function() {
        return this.hi < pow2(31) ? Uint64.prototype.valueOf.apply(this, arguments) : -(pow2(32) - this.lo + pow2(32) * (pow2(32) - 1 - this.hi));
    }, Int64.fromNumber = function(number) {
        var lo, hi;
        return 0 <= number ? (lo = (hi = Uint64.fromNumber(number)).lo, hi = hi.hi) : (lo = number - (hi = Math.floor(number / pow2(32))) * pow2(32), 
        hi += pow2(32)), new Int64(lo, hi);
    }, Uint64.prototype.toString = function() {
        if (this.hi < pow2(19)) return Number.prototype.toString.apply(this.valueOf(), arguments);
        for (var hiArray = numToDigits(this.hi), loArray = numToDigits(this.lo), i = 0; i < 32; i++) hiArray = add(hiArray, hiArray);
        for (var result = add(hiArray, loArray), str = "", i = result.length - 1; 0 <= i; i--) str += result[i];
        return str;
    }, Int64.prototype.toString = function() {
        return this.hi < pow2(31) ? Uint64.prototype.toString.apply(this, arguments) : this.hi > pow2(32) - 1 - pow2(19) ? Number.prototype.toString.apply(this.valueOf(), arguments) : "-" + new Uint64(pow2(32) - this.lo, pow2(32) - 1 - this.hi).toString();
    };
    var type, method, proto = jDataView.prototype = {
        compatibility: compatibility,
        jDataView: !0,
        _checkBounds: function(byteOffset, byteLength, maxLength) {
            if ("number" != typeof byteOffset) throw new TypeError("Offset is not a number.");
            if ("number" != typeof byteLength) throw new TypeError("Size is not a number.");
            if (byteLength < 0) throw new RangeError("Length is negative.");
            if (byteOffset < 0 || byteOffset + byteLength > defined(maxLength, this.byteLength)) throw new RangeError("Offsets are out of bounds.");
        },
        _action: function(type, isReadAction, byteOffset, littleEndian, value) {
            return this._engineAction(type, isReadAction, defined(byteOffset, this._offset), defined(littleEndian, this._littleEndian), value);
        },
        _dataViewAction: function(type, isReadAction, byteOffset, littleEndian, value) {
            return this._offset = byteOffset + dataTypes[type], isReadAction ? this._view["get" + type](byteOffset, littleEndian) : this._view["set" + type](byteOffset, value, littleEndian);
        },
        _arrayBufferAction: function(TypedArray, isReadAction, byteOffset, littleEndian, value) {
            var bytes = dataTypes[TypedArray], TypedArray = global[TypedArray + "Array"];
            if (littleEndian = defined(littleEndian, this._littleEndian), 1 === bytes || (this.byteOffset + byteOffset) % bytes == 0 && littleEndian) return typedArray = new TypedArray(this.buffer, this.byteOffset + byteOffset, 1), 
            this._offset = byteOffset + bytes, isReadAction ? typedArray[0] : typedArray[0] = value;
            var bytes = new Uint8Array(isReadAction ? this.getBytes(bytes, byteOffset, littleEndian, !0) : bytes), typedArray = new TypedArray(bytes.buffer, 0, 1);
            if (isReadAction) return typedArray[0];
            typedArray[0] = value, this._setBytes(byteOffset, bytes, littleEndian);
        },
        _arrayAction: function(type, isReadAction, byteOffset, littleEndian, value) {
            return isReadAction ? this["_get" + type](byteOffset, littleEndian) : this["_set" + type](byteOffset, value, littleEndian);
        },
        _getBytes: function(length, result, littleEndian) {
            littleEndian = defined(littleEndian, this._littleEndian), result = defined(result, this._offset), 
            length = defined(length, this.byteLength - result), this._checkBounds(result, length), 
            result += this.byteOffset, this._offset = result - this.byteOffset + length;
            result = this._isArrayBuffer ? new Uint8Array(this.buffer, result, length) : (this.buffer.slice || Array.prototype.slice).call(this.buffer, result, result + length);
            return littleEndian || length <= 1 ? result : arrayFrom(result).reverse();
        },
        getBytes: function(length, byteOffset, result, toArray) {
            result = this._getBytes(length, byteOffset, defined(result, !0));
            return toArray ? arrayFrom(result) : result;
        },
        _setBytes: function(byteOffset, bytes, littleEndian) {
            var length = bytes.length;
            if (0 !== length) {
                if (littleEndian = defined(littleEndian, this._littleEndian), byteOffset = defined(byteOffset, this._offset), 
                this._checkBounds(byteOffset, length), !littleEndian && 1 < length && (bytes = arrayFrom(bytes, !0).reverse()), 
                byteOffset += this.byteOffset, this._isArrayBuffer) new Uint8Array(this.buffer, byteOffset, length).set(bytes); else if (this._isNodeBuffer) new Buffer(bytes).copy(this.buffer, byteOffset); else for (var i = 0; i < length; i++) this.buffer[byteOffset + i] = bytes[i];
                this._offset = byteOffset - this.byteOffset + length;
            }
        },
        setBytes: function(byteOffset, bytes, littleEndian) {
            this._setBytes(byteOffset, bytes, defined(littleEndian, !0));
        },
        getString: function(byteLength, byteOffset, encoding) {
            if (this._isNodeBuffer) return byteOffset = defined(byteOffset, this._offset), byteLength = defined(byteLength, this.byteLength - byteOffset), 
            this._checkBounds(byteOffset, byteLength), this._offset = byteOffset + byteLength, 
            this.buffer.toString(encoding || "binary", this.byteOffset + byteOffset, this.byteOffset + this._offset);
            var bytes = this._getBytes(byteLength, byteOffset, !0);
            if (encoding = "utf8" === encoding ? "utf-8" : encoding || "binary", TextDecoder && "binary" !== encoding) return new TextDecoder(encoding).decode(this._isArrayBuffer ? bytes : new Uint8Array(bytes));
            var string = "";
            byteLength = bytes.length;
            for (var i = 0; i < byteLength; i++) string += String.fromCharCode(bytes[i]);
            return string = "utf-8" === encoding ? decodeURIComponent(escape(string)) : string;
        },
        setString: function(byteOffset, bytes, encoding) {
            if (this._isNodeBuffer) return byteOffset = defined(byteOffset, this._offset), this._checkBounds(byteOffset, bytes.length), 
            void (this._offset = byteOffset + this.buffer.write(bytes, this.byteOffset + byteOffset, encoding || "binary"));
            encoding = "utf8" === encoding ? "utf-8" : encoding || "binary", bytes = TextEncoder && "binary" !== encoding ? new TextEncoder(encoding).encode(bytes) : getCharCodes(bytes = "utf-8" === encoding ? unescape(encodeURIComponent(bytes)) : bytes), 
            this._setBytes(byteOffset, bytes, !0);
        },
        getChar: function(byteOffset) {
            return this.getString(1, byteOffset);
        },
        setChar: function(byteOffset, character) {
            this.setString(byteOffset, character);
        },
        tell: function() {
            return this._offset;
        },
        seek: function(byteOffset) {
            return this._checkBounds(byteOffset, 0), this._offset = byteOffset;
        },
        skip: function(byteLength) {
            return this.seek(this._offset + byteLength);
        },
        slice: function(start, end, forceCopy) {
            function normalizeOffset(offset, byteLength) {
                return offset < 0 ? offset + byteLength : offset;
            }
            return start = normalizeOffset(start, this.byteLength), end = normalizeOffset(defined(end, this.byteLength), this.byteLength), 
            forceCopy ? new jDataView(this.getBytes(end - start, start, !0, !0), void 0, void 0, this._littleEndian) : new jDataView(this.buffer, this.byteOffset + start, end - start, this._littleEndian);
        },
        alignBy: function(byteCount) {
            return this._bitOffset = 0, 1 !== defined(byteCount, 1) ? this.skip(byteCount - (this._offset % byteCount || byteCount)) : this._offset;
        },
        _getFloat64: function(sign, exponent) {
            var mantissa = this._getBytes(8, sign, exponent), sign = 1 - 2 * (mantissa[7] >> 7), exponent = ((mantissa[7] << 1 & 255) << 3 | mantissa[6] >> 4) - 1023, mantissa = (15 & mantissa[6]) * pow2(48) + mantissa[5] * pow2(40) + mantissa[4] * pow2(32) + mantissa[3] * pow2(24) + mantissa[2] * pow2(16) + mantissa[1] * pow2(8) + mantissa[0];
            return 1024 == exponent ? 0 !== mantissa ? NaN : 1 / 0 * sign : -1023 == exponent ? sign * mantissa * pow2(-1074) : sign * (1 + mantissa * pow2(-52)) * pow2(exponent);
        },
        _getFloat32: function(sign, exponent) {
            var mantissa = this._getBytes(4, sign, exponent), sign = 1 - 2 * (mantissa[3] >> 7), exponent = (mantissa[3] << 1 & 255 | mantissa[2] >> 7) - 127, mantissa = (127 & mantissa[2]) << 16 | mantissa[1] << 8 | mantissa[0];
            return 128 == exponent ? 0 != mantissa ? NaN : 1 / 0 * sign : -127 == exponent ? sign * mantissa * pow2(-149) : sign * (1 + mantissa * pow2(-23)) * pow2(exponent);
        },
        _get64: function(Type, byteOffset, littleEndian) {
            littleEndian = defined(littleEndian, this._littleEndian), byteOffset = defined(byteOffset, this._offset);
            for (var parts = littleEndian ? [ 0, 4 ] : [ 4, 0 ], i = 0; i < 2; i++) parts[i] = this.getUint32(byteOffset + parts[i], littleEndian);
            return this._offset = byteOffset + 8, new Type(parts[0], parts[1]);
        },
        getInt64: function(byteOffset, littleEndian) {
            return this._get64(Int64, byteOffset, littleEndian);
        },
        getUint64: function(byteOffset, littleEndian) {
            return this._get64(Uint64, byteOffset, littleEndian);
        },
        _getInt32: function(byteOffset, b) {
            b = this._getBytes(4, byteOffset, b);
            return b[3] << 24 | b[2] << 16 | b[1] << 8 | b[0];
        },
        _getUint32: function(byteOffset, littleEndian) {
            return this._getInt32(byteOffset, littleEndian) >>> 0;
        },
        _getInt16: function(byteOffset, littleEndian) {
            return this._getUint16(byteOffset, littleEndian) << 16 >> 16;
        },
        _getUint16: function(byteOffset, b) {
            b = this._getBytes(2, byteOffset, b);
            return b[1] << 8 | b[0];
        },
        _getInt8: function(byteOffset) {
            return this._getUint8(byteOffset) << 24 >> 24;
        },
        _getUint8: function(byteOffset) {
            return this._getBytes(1, byteOffset)[0];
        },
        _getBitRangeData: function(endBit, start) {
            var start = (defined(start, this._offset) << 3) + this._bitOffset, endBit = start + endBit, start = start >>> 3, b = this._getBytes((endBit + 7 >>> 3) - start, start, !0), wideValue = 0;
            (this._bitOffset = 7 & endBit) && (this._bitOffset -= 8);
            for (var i = 0, length = b.length; i < length; i++) wideValue = wideValue << 8 | b[i];
            return {
                start: start,
                bytes: b,
                wideValue: wideValue
            };
        },
        getSigned: function(bitLength, byteOffset) {
            var shift = 32 - bitLength;
            return this.getUnsigned(bitLength, byteOffset) << shift >> shift;
        },
        getUnsigned: function(bitLength, value) {
            value = this._getBitRangeData(bitLength, value).wideValue >>> -this._bitOffset;
            return bitLength < 32 ? value & ~(-1 << bitLength) : value;
        },
        _setBinaryFloat: function(byteOffset, value, mantSize, expSize, littleEndian) {
            var exponent, mantissa, signBit = value < 0 ? 1 : 0, eMax = ~(-1 << expSize - 1), eMin = 1 - eMax;
            0 === (value = value < 0 ? -value : value) ? mantissa = exponent = 0 : isNaN(value) ? (exponent = 2 * eMax + 1, 
            mantissa = 1) : value === 1 / 0 ? (exponent = 2 * eMax + 1, mantissa = 0) : eMin <= (exponent = Math.floor(Math.log(value) / Math.LN2)) && exponent <= eMax ? (mantissa = Math.floor((value * pow2(-exponent) - 1) * pow2(mantSize)), 
            exponent += eMax) : (mantissa = Math.floor(value / pow2(eMin - mantSize)), exponent = 0);
            for (var b = []; 8 <= mantSize; ) b.push(mantissa % 256), mantissa = Math.floor(mantissa / 256), 
            mantSize -= 8;
            for (exponent = exponent << mantSize | mantissa, expSize += mantSize; 8 <= expSize; ) b.push(255 & exponent), 
            exponent >>>= 8, expSize -= 8;
            b.push(signBit << expSize | exponent), this._setBytes(byteOffset, b, littleEndian);
        },
        _setFloat32: function(byteOffset, value, littleEndian) {
            this._setBinaryFloat(byteOffset, value, 23, 8, littleEndian);
        },
        _setFloat64: function(byteOffset, value, littleEndian) {
            this._setBinaryFloat(byteOffset, value, 52, 11, littleEndian);
        },
        _set64: function(Type, byteOffset, value, littleEndian) {
            "object" != typeof value && (value = Type.fromNumber(value)), littleEndian = defined(littleEndian, this._littleEndian), 
            byteOffset = defined(byteOffset, this._offset);
            var partName, parts = littleEndian ? {
                lo: 0,
                hi: 4
            } : {
                lo: 4,
                hi: 0
            };
            for (partName in parts) this.setUint32(byteOffset + parts[partName], value[partName], littleEndian);
            this._offset = byteOffset + 8;
        },
        setInt64: function(byteOffset, value, littleEndian) {
            this._set64(Int64, byteOffset, value, littleEndian);
        },
        setUint64: function(byteOffset, value, littleEndian) {
            this._set64(Uint64, byteOffset, value, littleEndian);
        },
        _setUint32: function(byteOffset, value, littleEndian) {
            this._setBytes(byteOffset, [ 255 & value, value >>> 8 & 255, value >>> 16 & 255, value >>> 24 ], littleEndian);
        },
        _setUint16: function(byteOffset, value, littleEndian) {
            this._setBytes(byteOffset, [ 255 & value, value >>> 8 & 255 ], littleEndian);
        },
        _setUint8: function(byteOffset, value) {
            this._setBytes(byteOffset, [ 255 & value ]);
        },
        setUnsigned: function(data, value, bitLength) {
            var data = this._getBitRangeData(bitLength, data), wideValue = data.wideValue, b = data.bytes;
            wideValue &= ~(~(-1 << bitLength) << -this._bitOffset), wideValue |= (bitLength < 32 ? value & ~(-1 << bitLength) : value) << -this._bitOffset;
            for (var i = b.length - 1; 0 <= i; i--) b[i] = 255 & wideValue, wideValue >>>= 8;
            this._setBytes(data.start, b, !0);
        }
    }, nodeNaming = {
        Int8: "Int8",
        Int16: "Int16",
        Int32: "Int32",
        Uint8: "UInt8",
        Uint16: "UInt16",
        Uint32: "UInt32",
        Float32: "Float",
        Float64: "Double"
    };
    for (type in proto._nodeBufferAction = function(type, isReadAction, byteOffset, nodeName, value) {
        this._offset = byteOffset + dataTypes[type];
        nodeName = nodeNaming[type] + ("Int8" === type || "Uint8" === type ? "" : nodeName ? "LE" : "BE");
        return byteOffset += this.byteOffset, isReadAction ? this.buffer["read" + nodeName](byteOffset) : this.buffer["write" + nodeName](value, byteOffset);
    }, dataTypes) !function(type) {
        proto["get" + type] = function(byteOffset, littleEndian) {
            return this._action(type, !0, byteOffset, littleEndian);
        }, proto["set" + type] = function(byteOffset, value, littleEndian) {
            this._action(type, !1, byteOffset, littleEndian, value);
        };
    }(type);
    for (method in proto._setInt32 = proto._setUint32, proto._setInt16 = proto._setUint16, 
    proto._setInt8 = proto._setUint8, proto.setSigned = proto.setUnsigned, proto) "set" === method.slice(0, 3) && function(type) {
        proto["write" + type] = function() {
            Array.prototype.unshift.call(arguments, void 0), this["set" + type].apply(this, arguments);
        };
    }(method.slice(3));
    return jDataView;
});