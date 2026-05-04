"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamValue = getParamValue;
function getParamValue(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
