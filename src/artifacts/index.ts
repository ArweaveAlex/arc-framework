import mime, { contentType } from 'mime-types';

import { getGQLData } from '../gql';
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

export async function createAsset(
	poolClient: IPoolClient,
	args: {
		index: any;
		paths: any;
		content: any;
		contentType: string;
		artifactType: ArtifactEnum;
		name: string;
		description: string;
		type: string;
		additionalMediaPaths: any;
		profileImagePath: any;
		associationId: string | null;
		associationSequence: string | null;
		childAssets: string[] | null;
		renderWith: string[] | null;
		assetId: string;
		fileType?: string;
		dataProtocol?: string;
	}
) {
	const contractTags = await createContractTags(poolClient, {
		index: args.index,
		paths: args.paths,
		contentType: args.contentType,
		artifactType: args.artifactType,
		name: args.name,
		description: args.description,
		type: args.type,
		additionalMediaPaths: args.additionalMediaPaths,
		profileImagePath: args.profileImagePath,
		associationId: args.associationId,
		associationSequence: args.associationSequence,
		childAssets: args.childAssets,
		renderWith: args.renderWith,
		assetId: args.assetId,
		fileType: args.fileType,
		dataProtocol: args.dataProtocol,
	});

	const assetId: string = await deployToBundlr(poolClient, {
		content: args.content,
		contentType: args.contentType,
		contractTags: contractTags,
	});

	await new Promise((r) => setTimeout(r, 2000));

	let fetchedAssetId: string;
	while (!fetchedAssetId) {
		await new Promise((r) => setTimeout(r, 2000));
		const gqlResponse = await getGQLData({
			ids: [assetId],
			tagFilters: null,
			uploaders: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
			useArweavePost: true,
		});

		if (gqlResponse && gqlResponse.data.length) {
			logValue(`Fetched Transaction`, gqlResponse.data[0].node.id, 0);
			fetchedAssetId = gqlResponse.data[0].node.id;
		} else {
			logValue(`Transaction Not Found`, assetId, 0);
		}
	}

	const contractId = await deployToWarp(poolClient, { assetId: assetId });
	if (contractId) {
		logValue(`Deployed Contract`, contractId, 0);
		return contractId;
	} else {
		return null;
	}
}

async function createContractTags(
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
		renderWith: string[] | null;
		assetId: string;
		fileType?: string | null | undefined;
		dataProtocol?: string | null | undefined;
	}
) {
	const dateTime = new Date().getTime().toString();
	const tokenHolder = await getContributor(poolClient);

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
		{ name: TAGS.keys.mediaIds, value: args.additionalMediaPaths ? JSON.stringify(args.additionalMediaPaths) : '' },
		{ name: TAGS.keys.profileImage, value: args.profileImagePath ? JSON.stringify(args.profileImagePath) : '' },
		{ name: TAGS.keys.associationId, value: args.associationId ? args.associationId : '' },
		{ name: TAGS.keys.associationSequence, value: args.associationSequence ? args.associationSequence : '' },
		{ name: TAGS.keys.childAssets, value: args.childAssets ? JSON.stringify(args.childAssets) : '' },
		{ name: TAGS.keys.implements, value: TAGS.values.ansVersion },
		{ name: TAGS.keys.initState, value: initState },
		{ name: TAGS.keys.license, value: TAGS.values.license },
		{ name: TAGS.keys.holderTitle, value: TAGS.values.holderTitle },
	];

	if (args.renderWith) {
		tagList.push({ name: TAGS.keys.renderWith, value: JSON.stringify(args.renderWith) });
	}

	if (args.dataProtocol) {
		tagList.push({ name: TAGS.keys.dataProtocol, value: args.dataProtocol });
	}

	if (args.fileType) {
		tagList.push({ name: TAGS.keys.fileType, value: args.fileType });
	}

	if (poolClient.poolConfig.topics) {
		for (let i = 0; i < poolClient.poolConfig.topics.length; i++) {
			tagList.push({ name: TAGS.keys.topic(poolClient.poolConfig.topics[i]), value: poolClient.poolConfig.topics[i] });
		}
	}

	return tagList;
}

async function deployToBundlr(
	poolClient: IPoolClient,
	args: {
		content: any;
		contentType: string;
		contractTags: any;
	}
) {
	let finalContent: any;

	switch (args.contentType) {
		case CONTENT_TYPES.json as any:
			finalContent = JSON.stringify(args.content);
			break;
		default:
			finalContent = args.content;
			break;
	}

	try {
		const transaction = poolClient.arClient.bundlr.createTransaction(finalContent, { tags: args.contractTags });
		await transaction.sign();
		return (await transaction.upload()).id;
	} catch (e: any) {
		throw new Error(`Error uploading to bundlr ...\n ${e}`);
	}
}

async function deployToWarp(poolClient: IPoolClient, args: { assetId: string }) {
	try {
		const { contractTxId } = await poolClient.arClient.warpDefault.register(args.assetId, 'arweave');
		return contractTxId;
	} catch (e: any) {
		console.error(e);
		logValue(`Error deploying to Warp - Asset ID`, args.assetId, 1);

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
					logValue(`Error deploying to Warp - Asset ID`, args.assetId, 1);
					continue;
				}
			}
		}
	}

	throw new Error(`Warp retries failed ...`);
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
