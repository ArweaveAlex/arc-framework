import { ArweaveClient } from '../clients';

export async function deployBundle(deployKey: string, contract: string, folderPath: string): Promise<string> {
	const jwk = JSON.parse(Buffer.from(deployKey, 'base64').toString('utf-8'));
	const arClient = new ArweaveClient(jwk);

	const connectedContract = arClient.warp.contract(contract).connect(jwk);

	const result = await arClient.bundlr.uploadFolder(folderPath, {
		indexFile: 'index.html',
	});

	await new Promise((r) => setTimeout(r, 1000));

	await connectedContract.writeInteraction({
		function: 'setRecord',
		subDomain: '@',
		transactionId: result.id,
	});

	return result.id;
}
