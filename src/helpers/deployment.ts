import Bundlr from '@bundlr-network/client';

// import { ArweaveClient } from '../clients'

export async function deployBundle(deployKey: string, contract: string, folderPath: string): Promise<string> {
	const BUNDLR_NODE = 'https://node2.bundlr.network';
	const CURRENCY = 'arweave';

    const jwk = JSON.parse(Buffer.from(deployKey, 'base64').toString('utf-8'));
    
	// const arClient = new ArweaveClient();
    // // const arClient = new ArweaveClient(jwk);
	
	const bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, jwk);

	console.log(bundlr);

    // const connectedContract = arClient.warp.contract(contract).connect(jwk);
    // const result = await bundlr.uploadFolder(folderPath, {
	// 	indexFile: 'index.html',
	// });
    // // const result = await arClient.bundlr.uploadFolder(folderPath, {
	// // 	indexFile: 'index.html',
	// // });

    // await new Promise((r) => setTimeout(r, 1000));

	// await connectedContract.writeInteraction({
	// 	function: 'setRecord',
	// 	subDomain: '@',
	// 	transactionId: result.id,
	// });

    // return result.id;
	console.log(deployKey);
	console.log(contract);
	console.log(folderPath);
	return 'Test deploy contract';
}