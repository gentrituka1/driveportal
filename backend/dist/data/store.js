"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const now = () => new Date().toISOString();
const adminId = (0, node_crypto_1.randomUUID)();
const defaultGroupId = (0, node_crypto_1.randomUUID)();
const store = {
    users: [
        {
            id: adminId,
            email: "admin@driveportal.local",
            passwordHash: bcryptjs_1.default.hashSync("Admin123!", 10),
            role: "ADMIN",
            createdAt: now(),
        },
    ],
    groups: [
        {
            id: defaultGroupId,
            name: "Default Group",
            createdBy: adminId,
            createdAt: now(),
        },
    ],
    groupMembers: [],
    folders: [],
    files: [],
    folderPermissions: [],
    filePermissions: [],
};
exports.default = store;
