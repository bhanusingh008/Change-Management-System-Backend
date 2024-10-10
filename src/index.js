"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var client_1 = require("@prisma/client");
var morgan_1 = require("morgan");
var cors_1 = require("cors");
var jsonwebtoken_1 = require("jsonwebtoken");
var bcrypt_1 = require("bcrypt");
var authMiddlewares_1 = require("./middlewares/authMiddlewares");
// Initialize Prisma Client
var prisma = new client_1.PrismaClient();
var app = (0, express_1.default)();
app.use(express_1.default.json());
// Using morgan for http request logging
app.use((0, morgan_1.default)("dev"));
// have cors enabled
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173"], // Allow these origins
    methods: ["GET", "POST"], // Allowed methods
    allowedHeaders: ["Content-Type"], // Allowed headers
}));
app.post("/add-user", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, role, hashedPassword, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password, role = _a.role;
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 1:
                hashedPassword = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, prisma.user.create({
                        data: {
                            email: email,
                            password: hashedPassword,
                            role: role,
                        },
                    })];
            case 3:
                user = _b.sent();
                res.status(201).json(user);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                res.status(500).json("Failed to Add User");
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// User Login
app.post("/login-user", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isPasswordValid, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { email: email },
                    })];
            case 2:
                user = _b.sent();
                // If user is not found
                if (!user) {
                    res.status(401).json({ message: "Invalid email or password" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
            case 3:
                isPasswordValid = _b.sent();
                // If password is incorrect
                if (!isPasswordValid) {
                    res.status(401).json({ message: "Invalid email or password" });
                    return [2 /*return*/];
                }
                token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, "jwt_token", {
                    expiresIn: "1h", // Token expiration time
                });
                // Send token as response
                res.status(200).json({ token: token });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _b.sent();
                console.error(error_2);
                res.status(500).json({ message: "Internal server error" });
                return [2 /*return*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
// endpoint to add a change ticked
app.post("/add-change-ticket", authMiddlewares_1.default, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, priority, type, affectedSystems, createdById, creatorRole, ticket, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, title = _a.title, description = _a.description, priority = _a.priority, type = _a.type, affectedSystems = _a.affectedSystems, createdById = _a.createdById, creatorRole = _a.creatorRole;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma.changeTicket.create({
                        data: {
                            title: title,
                            description: description,
                            priority: priority,
                            type: type,
                            affectedSystems: affectedSystems,
                            createdById: createdById,
                            creatorRole: creatorRole,
                        },
                    })];
            case 2:
                ticket = _b.sent();
                res.status(201).json(ticket);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error(error_3);
                res.status(500).json({ error: "Failed to create change ticket" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Start the server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
