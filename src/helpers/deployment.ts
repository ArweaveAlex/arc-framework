import { ArweaveClient } from '../clients';

export async function deployBundle(deployKey: string, contract: string, folderPath: string): Promise<void> {
	const jwk = JSON.parse(Buffer.from(deployKey, 'base64').toString('utf-8'));

	const arClient = new ArweaveClient(jwk);
	const warpContract = arClient.warp.contract(contract).connect(jwk);
	const contractState: any = (await warpContract.readState()).cachedValue.state;

	try {
		console.log(`Deploying ${folderPath} folder`);
		const bundlrResult = await arClient.bundlr.uploadFolder(folderPath, {
			indexFile: 'index.html',
		});

		await new Promise((r) => setTimeout(r, 1000));

		await warpContract.writeInteraction({
			function: 'setRecord',
			subDomain: '@',
			transactionId: bundlrResult.id,
		});

		console.log(`Deployed [${bundlrResult.id}] to [${contractState.name}]`);
	} catch (e: any) {
		console.error(e);
	}
}
