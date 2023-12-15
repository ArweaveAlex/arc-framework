export const NFT_INIT_STATE = {
	title: 'Alex Archiving Artifact',
	name: 'Artefact #000000',
	description: 'Minted from archiving pool Alex...',
	ticker: 'KOINFT',
	balances: {},
	maxSupply: 1,
	contentType: 'application/json',
	transferable: false,
	lockTime: 0,
	lastTransferTimestamp: null,
};

export const NFT_CONTRACT_SRC = `
"use strict";
function handle(state, action) {
    const input = action.input;
    const caller = action.caller;
    if (input.function === "transfer") {
        ContractAssert(state.transferable ?? true, "Token cannot be transferred - soulbound");
        const current = SmartWeave.block.timestamp;
        if (state.lastTransferTimestamp && state.lockTime) {
            ContractAssert((current - state.lastTransferTimestamp) <= state.lockTime, "Token cannot be transferred - time-based soulbound");
        }
        const target = input.target;
        ContractAssert(target, "No target specified.");
        ContractAssert(caller !== target, "Invalid token transfer.");
        const qty = Number(input.qty) * Number(state.maxSupply);
        ContractAssert(qty && qty > 0 && Number.isInteger(qty), "No valid quantity specified.");
        const balances = state.balances;
        ContractAssert(caller in balances && balances[caller] >= qty, "Caller has insufficient funds");
        balances[caller] -= qty;
        if (balances[caller] === 0) {
            delete balances[caller];
        }
        if (!(target in balances)) {
            balances[target] = 0;
        }
        balances[target] += qty;
        state.balances = balances;
        state.lastTransferTimestamp = current;
        return { state };
    }
    if (input.function === "balance") {
        let target;
        if (input.target) {
            target = input.target;
        }
        else {
            target = caller;
        }
        const ticker = state.ticker;
        const balances = state.balances;
        ContractAssert(typeof target === "string", "Must specify target to retrieve balance for.");
        return {
            result: {
                target,
                ticker,
                balance: target in balances ? balances[target] / state.maxSupply : 0,
                intBalance: target in balances ? balances[target] : 0
            }
        };
    }
    if (input.function === "allow") {
        const target = input.target;
        const quantity = input.qty;
        const balances = state.balances;

        if (!Number.isInteger(quantity) || quantity === undefined) {
            throw new ContractError("Invalid value for quantity. Must be an integer.");
        }
        if (!target) {
            throw new ContractError("No target specified.");
        }
        if (target === SmartWeave.contract.id) {
            throw new ContractError("Can't setup claim to transfer a balance to itself.");
        }
        if (quantity <= 0 || caller === target) {
            throw new ContractError("Invalid balance transfer.");
        }
        if (balances[caller] < quantity || !balances[caller] || balances[caller] == undefined || balances[caller] == null || isNaN(balances[caller])) {
            throw new ContractError("Caller balance not high enough to make a balance of " + quantity + "claimable.");
        }
    
        balances[caller] -= quantity;
    
        state.claimable.push({
            from: caller,
            to: target,
            qty: quantity,
            txID: SmartWeave.transaction.id,
        });
    }
    if (input.function === "claim") {
        // Claim input: txID
        const txID = input.txID;
        // Claim qty
        const qty = input.qty;
        const balances = state.balances;

        if (!state.claimable.length) {
            throw new ContractError("Contract has no claims available.");
        }
        // Search for txID inside of 'claimable'
        let obj;
        let index = -1;
        for (let i = 0; i < state.claimable.length; i++) {
            if (state.claimable[i].txID === txID) {
                index = i;
                obj = state.claimable[i];
            }
        }
        if (obj === undefined) {
            throw new ContractError("Unable to find claim.");
        }
        if (obj.to !== caller) {
            throw new ContractError("Claim not addressed to caller.");
        }
        if (obj.qty !== qty) {
            throw new ContractError("Claiming incorrect quantity of tokens.");
        }
        // Check to make sure it hasn't been claimed already
        for (let i = 0; i < state.claims.length; i++) {
            if (state.claims[i] === txID) {
                throw new ContractError("This claim has already been made.");
            }
        }
        // Not already claimed --> can claim
        if (!balances[caller]) {
            balances[caller] = 0;
        }
        balances[caller] += obj.qty;
    
        // remove from claimable
        state.claimable.splice(index, 1);
    
        // add txID to 'claims'
        state.claims.push(txID);
    }
    throw new ContractError("No function supplied or function not recognized.");
}
`;

export const POOL_CONTRACT_SRC = `
"use strict";
function addOrUpdateBigStrings(object, key, qty) {
    if (object[key]) {
        object[key] = (BigInt(object[key]) + qty).toString();
    }
    else {
        object[key] = qty.toString();
    }
}
function updateContributions(object, key, qty) {
    if (object[key]) {
        object[key].push({
            timestamp: SmartWeave.block.timestamp.toString(), qty: BigInt(qty).toString()
        });
    }
    else {
        object[key] = [{ timestamp: SmartWeave.block.timestamp.toString(), qty: qty.toString() }];
    }
}
function addOrUpdateIntStrings(object, key, qty) {
    if (object[key]) {
        object[key] = (parseInt(object[key]) + qty).toString();
    }
    else {
        object[key] = qty.toString();
    }
}
async function handle(state, action) {
    const caller = action.caller;
    const canEvolve = state.canEvolve;
    switch (action.input.function) {
        case "contribute": {
            const contribution = BigInt(SmartWeave.transaction.quantity);
            const target = SmartWeave.transaction.target;
            const totalSupply = parseInt(state.totalSupply);
            const totalContributions = BigInt(state.totalContributions);
            if ((target !== state.owner) && (target !== state.controlPubkey)) {
                throw new ContractError("Please fund the correct owner or controller.");
            }
            if (contribution == BigInt(0)) {
                throw new ContractError("Please fund a non-zero amount");
            }
            if (totalContributions == BigInt(0)) {
                state.tokens = {};
                state.tokens[caller] = state.totalSupply.toString();
                updateContributions(state.contributors, action.caller, contribution);
                state.totalContributions = (totalContributions + contribution).toString();
            }
            else {
                const mintedTokens = (Number(BigInt(1000000000000) * contribution / totalContributions) / 1000000000000) * Number(totalSupply);
                const adjustmentFactor = Number(totalSupply) / Number(totalSupply + mintedTokens);
                let sum = 0;
                for (const key in state.tokens) {
                    const newAlloc = state.tokens[key] * adjustmentFactor;
                    sum += newAlloc;
                    state.tokens[key] = newAlloc.toString();
                }
                addOrUpdateBigStrings(state, "balance", contribution);
                addOrUpdateIntStrings(state.tokens, action.caller, totalSupply - sum);
                updateContributions(state.contributors, action.caller, contribution);
                state.totalContributions = (totalContributions + contribution).toString();
            }
            return { state };
        }
        case "setTopics": {
            if (state.owner !== caller) {
                throw new ContractError('Only the owner can add topics.');
            }
            
            state.topics = action.input.data;
        
            return { state };
        }
        case "evolve": {
            if (canEvolve) {
                if (state.owner !== caller) {
                  throw new ContractError('Only the owner can evolve a contract.');
                }
            
                state.evolve = action.input.value;
            
                return { state };
            }
        }
        case "updateUsedFunds": {
            if (state.owner !== caller) {
                throw new ContractError('Only the owner can update used funds state.');
            }
        
            state.usedFunds = action.input.data;
        
            return { state };
        }
        default: {
            throw new ContractError("No action " + action.input.function + " exists. Please send a valid action.");
        }
    }
}
`;
