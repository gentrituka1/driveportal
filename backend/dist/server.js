"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
app_1.default.listen(env_1.default.port, () => {
    console.log(`DrivePortal backend listening on http://localhost:${env_1.default.port}`);
});
