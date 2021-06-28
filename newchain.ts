import * as crypto from 'crypto';

class Transaction {
    constructor(
        public amount: number,
        public payer: string,
        public payee: string,
    ) {}
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    public nonce = Math.round(Math.random() * 9999999);
    constructor(public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');   
        hash.update(str).end();
        return hash.digest('hex');
    }
}
let balances = new Map<string, number>();
class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, "owner", '0'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
            balances.set(transaction.payer, (balances.get(transaction.payer) || 0) - transaction.amount);
            balances.set(transaction.payee, (balances.get(transaction.payee) || 0) + transaction.amount);
        }
    }
    mine(nonce:number) {
        let solution = 1;
        console.log("⛏️ Mining...");
        while(true) {
            const hash = crypto.createHash("SHA256");
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if(attempt.substr(0, 4) === "0000") {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }
}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        //rsa moze da se decoduje
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    get Balance():number {
        return balances.get(this.publicKey) || 0;
    }
    sendMoney(amount: number, payeePublicKey: string) {
        if(this.Balance >= amount) {
            const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
            const sign = crypto.createSign("SHA256");
            sign.update(transaction.toString()).end();
            const signature = sign.sign(this.privateKey);
            Chain.instance.addBlock(transaction, this.publicKey, signature);
        }else {
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