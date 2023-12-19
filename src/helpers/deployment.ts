import Bundlr from '@bundlr-network/client';

import { ArweaveClient } from '../clients';

import { BUNDLR_CONFIG } from './config';

export async function deployBundle(deployKey: string, contract: string, folderPath: string): Promise<void> {
	const jwk = JSON.parse(Buffer.from(deployKey, 'base64').toString('utf-8'));

	const arClient = new ArweaveClient(jwk);
	const warpContract = arClient.warpArweaveGateway.contract(contract).connect(jwk);
	const contractState: any = (await warpContract.readState()).cachedValue.state;

	const bundlr = new Bundlr(BUNDLR_CONFIG.node2, BUNDLR_CONFIG.currency, jwk);

	try {
		console.log(`Deploying ${folderPath} folder`);
		const bundlrResult = await bundlr.uploadFolder(folderPath, {
			indexFile: 'index.html',
		});

		await new Promise((r) => setTimeout(r, 1000));

		await warpContract.writeInteraction(
			{
				function: 'setRecord',
				subDomain: '@',
				transactionId: bundlrResult.id,
			},
			{ disableBundling: true }
		);

		console.log(`Deployed [${bundlrResult.id}] to [${contractState.name}]`);
	} catch (e: any) {
		console.error(e);
	}
}
