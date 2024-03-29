// import { InjectedArweaveSigner } from 'warp-contracts-plugin-deploy';

// import { CollectionStateType, TAGS } from '../../helpers';
import { ArweaveClient } from '../arweave';

export default class CollectionClient extends ArweaveClient {
	// async createCollection(collectionState: CollectionStateType) {
	//     if (window.arweaveWallet) {
	//     	await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ACCESS_PUBLIC_KEY', 'SIGNATURE']);
	//     }
	//     const userSigner = new InjectedArweaveSigner(window.arweaveWallet);
	//     await userSigner.setPublicKey();
	//     const tags = [
	//     	{ name: TAGS.keys.appType, value: TAGS.values.collectionAppType },
	//     	{ name: TAGS.keys.collectionName, value: collectionState.title },
	//     	{ name: TAGS.keys.collectionDescription, value: collectionState.description },
	//     	{ name: TAGS.keys.ansTitle, value: collectionState.title },
	//     	{ name: `${TAGS.keys.ansTopic}:${collectionState.topic}`, value: collectionState.topic },
	//     	{ name: TAGS.keys.ansDescription, value: collectionState.description },
	//     	{ name: TAGS.keys.ansType, value: TAGS.values.ansType },
	//     	{ name: TAGS.keys.ansImplements, value: TAGS.values.ansVersion },
	//     	{ name: TAGS.keys.initialOwner, value: collectionState.owner },
	//     ];
	//     const collectionContract = await this.warpDefault.createContract.deploy({
	//     	src: COLLECTION_CONTRACT,
	//     	initState: JSON.stringify(collectionState),
	//     	wallet: userSigner,
	//     	tags: tags,
	//     });
	//     return {
	//     	id: collectionContract.contractTxId,
	//     	state: collectionState,
	//     };
	// }
}

// const COLLECTION_CONTRACT = `
// 'use strict';
// async function handle(state, action) {
// 	const input = action.input;
// 	const caller = action.caller;
// 	const canEvolve = state.canEvolve;
// 	switch (action.input.function) {
// 		case 'add': {
// 			if (state.owner !== caller) {
// 				throw new ContractError('Only the owner can update this contracts state.');
// 			}
// 			let inputIds = input.ids;
// 			let existingIds = state.ids;

// 			let finalIds = [...new Set(existingIds.concat(inputIds))];

// 			state.ids = finalIds;

// 			state.title = input.title ? input.title : state.title;
// 			state.name = input.name ? input.name : state.name;
// 			state.topic = input.topic ? input.topic : state.topic;
// 			state.description = input.description ? input.description : state.description;

// 			return { state };
// 		}
// 		case 'remove': {
// 			if (state.owner !== caller) {
// 				throw new ContractError('Only the owner can update this contracts state.');
// 			}
// 			let inputIds = input.ids;
// 			let existingIds = state.ids;

// 			let finalIds = existingIds.filter((id) => {
// 				return !inputIds.includes(id);
// 			});

// 			state.ids = finalIds;

// 			state.title = input.title ? input.title : state.title;
// 			state.name = input.name ? input.name : state.name;
// 			state.topic = input.topic ? input.topic : state.topic;
// 			state.description = input.description ? input.description : state.description;

// 			return { state };
// 		}
// 		case 'transfer': {
// 			ContractAssert(state.transferable ?? true, 'Token cannot be transferred - soulbound');
// 			const current = SmartWeave.block.timestamp;
// 			if (state.lastTransferTimestamp && state.lockTime) {
// 				ContractAssert(current - state.lastTransferTimestamp <= state.lockTime, 'Token cannot be transferred - time-based soulbound');
// 			}
// 			const target = input.target;
// 			ContractAssert(target, 'No target specified.');
// 			ContractAssert(caller !== target, 'Invalid token transfer.');
// 			const qty = Number(input.qty) * Number(state.maxSupply);
// 			ContractAssert(qty && qty > 0 && Number.isInteger(qty), 'No valid quantity specified.');
// 			const balances = state.balances;
// 			ContractAssert(caller in balances && balances[caller] >= qty, 'Caller has insufficient funds');
// 			balances[caller] -= qty;
// 			if (balances[caller] === 0) {
// 				delete balances[caller];
// 			}
// 			if (!(target in balances)) {
// 				balances[target] = 0;
// 			}
// 			balances[target] += qty;
// 			state.balances = balances;
// 			state.lastTransferTimestamp = current;
// 			return { state };
// 		}
// 		case 'balance': {
// 			let target;
// 			if (input.target) {
// 				target = input.target;
// 			} else {
// 				target = caller;
// 			}
// 			const ticker = state.ticker;
// 			const balances = state.balances;
// 			ContractAssert(typeof target === 'string', 'Must specify target to retrieve balance for.');
// 			return {
// 				result: {
// 					target,
// 					ticker,
// 					balance: target in balances ? balances[target] / state.maxSupply : 0,
// 					intBalance: target in balances ? balances[target] : 0,
// 				},
// 			};
// 		}
// 		case 'evolve': {
// 			if (canEvolve) {
// 				if (state.owner !== caller) {
// 					throw new ContractError('Only the owner can evolve a contract.');
// 				}

// 				state.evolve = input.value;

// 				return { state };
// 			}
// 		}
// 		default: {
// 			throw new ContractError('Action does not exist please send a valid action.');
// 		}
// 	}
// }
// `;
