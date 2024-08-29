import { toNano } from '@ton/core';
import { NzComTact } from '../wrappers/NzComTact';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nzComTact = provider.open(await NzComTact.fromInit(BigInt(Math.floor(Math.random() * 10000))))

    await nzComTact.send(
        provider.sender(),
        {
            value: toNano('0.14'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    )

    await provider.waitForDeploy(nzComTact.address)

    console.log('ID deployed', await nzComTact.getId())
}
