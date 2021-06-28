"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 9999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
let balances = new Map();
class Chain {
    constructor() {
        this.chain = [new Block('', new Transaction(100, "owner", '0'))];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
            balances.set(transaction.payer, (balances.get(transaction.payer) || 0) - transaction.amount);
            balances.set(transaction.payee, (balances.get(transaction.payee) || 0) + transaction.amount);
        }
    }
    mine(nonce) {
        let solution = 1;
        console.log("⛏️ Mining...");
        while (true) {
            const hash = crypto.createHash("SHA256");
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) === "0000") {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
}
Chain.instance = new Chain();
class Wallet {
    constructor() {
        //rsa moze da se decoduje
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    get Balance() {
        return balances.get(this.publicKey) || 0;
    }
    sendMoney(amount, payeePublicKey) {
        if (this.Balance >= amount) {
            const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
            const sign = crypto.createSign("SHA256");
            sign.update(transaction.toString()).end();
            const signature = sign.sign(this.privateKey);
            Chain.instance.addBlock(transaction, this.publicKey, signature);
        }
        else {
            console.log("Your don't have enough balance for this transaction!");
        }
    }
}
const marko = new Wallet();
const bob = new Wallet();
const pera = new Wallet();
balances.set(marko.publicKey, 100);
console.log("Marko Before: " + marko.Balance);
console.log("Bob Before: " + bob.Balance);
marko.sendMoney(10, bob.publicKey);
console.log("Marko After: " + marko.Balance);
console.log("Bob After: " + bob.Balance);
console.log(Chain.instance);
