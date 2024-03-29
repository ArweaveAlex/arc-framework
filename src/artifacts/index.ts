import mime, { contentType } from 'mime-types';

import { ARTIFACT_CONTRACT, ARTIFACT_TYPES_BY_FILE, CONTENT_TYPES, TAGS } from '../helpers/config';
import { ArtifactEnum, IPoolClient } from '../helpers/types';
import { log, logValue } from '../helpers/utils';

export function getMimeType(fileName: string) {
	return mime.contentType(mime.lookup(fileName) || CONTENT_TYPES.octetStream) as string;
}

export function getArtifactType(fileType: string) {
	return ARTIFACT_TYPES_BY_FILE[fileType] ? ARTIFACT_TYPES_BY_FILE[fileType] : ArtifactEnum.File;
}

export function getAnsType(alexType: string) {
	let ansType: string;
	switch (alexType) {
		case ArtifactEnum.Video:
			ansType = TAGS.values.ansTypes.video;
			break;
		case ArtifactEnum.Audio:
			ansType = TAGS.values.ansTypes.music;
			break;
		case ArtifactEnum.Image:
			ansType = TAGS.values.ansTypes.image;
			break;
		case ArtifactEnum.Document:
			ansType = TAGS.values.ansTypes.document;
			break;
		case ArtifactEnum.Ebook:
			ansType = TAGS.values.ansTypes.document;
			break;
		case ArtifactEnum.File:
			ansType = TAGS.values.ansTypes.file;
			break;
	}
	return ansType;
}

export async function createContract(poolClient: IPoolClient, args: { assetId: string }) {
	try {
		const { contractTxId } = await poolClient.arClient.warpDefault.register(args.assetId, 'arweave');
		return contractTxId;
	} catch (e: any) {
		console.error(e);
		logValue(`Error creating contract - Asset ID`, args.assetId, 1);

		const errorString = e.toString();
		if (errorString.indexOf('500') > -1) {
			return null;
		}

		if (errorString.indexOf('502') > -1 || errorString.indexOf('504') > -1 || errorString.indexOf('FetchError') > -1) {
			let retries = 5;
			for (let i = 0; i < retries; i++) {
				await new Promise((r) => setTimeout(r, 2000));
				try {
					log(`Retrying Warp ...`, null);
					const { contractTxId } = await poolClient.arClient.warpDefault.register(args.assetId, 'arweave');
					log(`Retry succeeded`, 0);
					return contractTxId;
				} catch (e2: any) {
					logValue(`Error creating contract - Asset ID`, args.assetId, 1);
					continue;
				}
			}
		}
	}

	throw new Error(`Warp retries failed ...`);
}

export async function createContractTags(
	poolClient: IPoolClient,
	args: {
		index: any;
		paths: any;
		contentType: string;
		artifactType: ArtifactEnum;
		name: string;
		description: string;
		type: string;
		additionalMediaPaths: any;
		profileImagePath: any;
		associationId: string | null;
		associationSequence: string | null;
		childAssets: string[];
		renderWith: string | null;
		assetId: string;
		fileType?: string | null | undefined;
		dataProtocol?: string | null | undefined;
		originalUrl?: string | null | undefined;
	}
) {
	const dateTime = new Date().getTime().toString();

	let tokenHolder: string;
	try {
		tokenHolder = await getContributor(poolClient);
	} catch (e: any) {
		tokenHolder = poolClient.poolConfig.state.owner.pubkey;
	}

	let contractSrc = ARTIFACT_CONTRACT.srcNonTradeable;
	let initStateJson: any = {
		ticker: TAGS.values.initState.ticker(args.assetId),
		balances: {
			[tokenHolder]: 1,
		},
		transferable: false,
		canEvolve: true,
		contentType: contentType,
		description: args.description,
		lastTransferTimestamp: null,
		lockTime: 0,
		maxSupply: 1,
		title: TAGS.values.initState.title(args.name),
		name: TAGS.values.initState.name(args.name),
		dateCreated: dateTime,
		owner: tokenHolder,
	};

	if (poolClient.poolConfig.tradeable) {
		contractSrc = ARTIFACT_CONTRACT.srcTradeable;
		initStateJson.claimable = [];
		initStateJson.claims = [];
		initStateJson.transferable = true;
	}

	const initState = JSON.stringify(initStateJson);

	const tagList: any[] = [
		{ name: TAGS.keys.appName, value: TAGS.values.appName },
		{ name: TAGS.keys.appVersion, value: TAGS.values.appVersion },
		{ name: TAGS.keys.contentType, value: args.contentType },
		{ name: TAGS.keys.contractSrc, value: contractSrc },
		{ name: TAGS.keys.poolId, value: poolClient.poolConfig.contracts.pool.id },
		{ name: TAGS.keys.title, value: args.name },
		{ name: TAGS.keys.description, value: args.description },
		{ name: TAGS.keys.type, value: args.type },
		{ name: TAGS.keys.artifactSeries, value: TAGS.values.application },
		{ name: TAGS.keys.artifactName, value: args.name },
		{ name: TAGS.keys.initialOwner, value: tokenHolder },
		{ name: TAGS.keys.dateCreated, value: dateTime },
		{ name: TAGS.keys.artifactType, value: args.artifactType },
		{ name: TAGS.keys.keywords, value: JSON.stringify(poolClient.poolConfig.keywords) },
		{ name: TAGS.keys.implements, value: TAGS.values.ansVersion },
		{ name: TAGS.keys.initState, value: initState },
		{ name: TAGS.keys.license, value: TAGS.values.license },
		{ name: TAGS.keys.holderTitle, value: TAGS.values.holderTitle },
	];

	if (args.additionalMediaPaths)
		tagList.push({ name: TAGS.keys.mediaIds, value: JSON.stringify(args.additionalMediaPaths) });
	if (args.profileImagePath)
		tagList.push({ name: TAGS.keys.profileImage, value: JSON.stringify(args.profileImagePath) });
	if (args.associationId) tagList.push({ name: TAGS.keys.associationId, value: args.associationId });
	if (args.associationSequence) tagList.push({ name: TAGS.keys.associationSequence, value: args.associationSequence });
	if (args.childAssets) tagList.push({ name: TAGS.keys.childAssets, value: JSON.stringify(args.childAssets) });

	if (args.renderWith) tagList.push({ name: TAGS.keys.renderWith, value: args.renderWith });
	if (args.dataProtocol) tagList.push({ name: TAGS.keys.dataProtocol, value: args.dataProtocol });
	if (args.originalUrl) tagList.push({ name: TAGS.keys.originalUrl, value: args.originalUrl });
	if (args.fileType) tagList.push({ name: TAGS.keys.fileType, value: args.fileType });

	if (poolClient.poolConfig.topics) {
		for (let i = 0; i < poolClient.poolConfig.topics.length; i++) {
			tagList.push({ name: TAGS.keys.topic(poolClient.poolConfig.topics[i]), value: poolClient.poolConfig.topics[i] });
		}
	}

	return tagList;
}

async function getContributor(poolClient: IPoolClient) {
	try {
		const evaluationResults: any = await poolClient.contract.readState();
		const state = evaluationResults.cachedValue.state;
		return selectTokenHolder(state.tokens, state.totalSupply);
	} catch (e: any) {
		throw new Error(e);
	}
}

export function selectTokenHolder(tokens: any, totalSupply: number) {
	const weights: { [key: string]: any } = {};
	for (const address of Object.keys(tokens)) {
		weights[address] = tokens[address] / totalSupply;
	}
	let sum = 0;
	const r = Math.random();
	for (const address of Object.keys(weights)) {
		sum += weights[address];
		if (r <= sum && weights[address] > 0) {
			return address;
		}
	}

	throw new Error(`Unable to select token holder`);
}
