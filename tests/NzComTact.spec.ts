import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox'
import { toNano } from '@ton/core'
import { NzComTact } from '../wrappers/NzComTact'
import '@ton/test-utils'

describe('Testing the NzComTact contract', () => {
    let blockchain: Blockchain
    let deployer: SandboxContract<TreasuryContract>
    let nzComTact: SandboxContract<NzComTact>

    beforeEach(async () => {
        // GIVEN the blockchain initialized
        blockchain = await Blockchain.create()

        // AND a contract set up
        const DEPLOY_ID = 0n
        nzComTact = blockchain.openContract(await NzComTact.fromInit(DEPLOY_ID))

        // AND Treasury is chosen as a deployer
        deployer = await blockchain.treasury('deployer')

        // WHEN deploying the contract
        const deployResult = await nzComTact.send(
            deployer.getSender(),
            {
                value: toNano('0.15'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        )

        // THEN the contract is deployed successfully
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nzComTact.address,
            deploy: true,
            success: true,
        })

        // AND the deploy ID matches the expected one
        expect(await nzComTact.getId()).toEqual(DEPLOY_ID)

        // AND the owner of the contract is the deployment sender
        expect((await nzComTact.getOwner()).toRaw()).toEqual(deployer.address.toRaw())
    })

    test("should deploy", async () => {
        // We just want to make sure that the test in beforeEach always pass
    })

    test("Should deposit an amount to the contract", async () => {
        // GIVEN the deposit amount of 1 TON
        const DEPOSIT_AMOUNT = toNano("1")

        // WHEN the deposit is sent
        await nzComTact.send(
            deployer.getSender(),
            {
                value: DEPOSIT_AMOUNT,
            },
            {
                $$type: "Deposit"
            }
        )

        // THEN the contract balance is increased by the deposit amount minus the gas spent
        expect(await nzComTact.getBalance()).toBeGreaterThan(toNano("0.95"))
    })

    test("Should accept deposit and refuse withdrawal from non-owner", async () => {
        // GIVEN there is a rich man on TON network
        const nonOwner = await blockchain.treasury("nonOwner")

        // AND he deposits an amount to the contract
        const DEPOSIT_AMOUNT = toNano("2")
        await nzComTact.send(
            nonOwner.getSender(),
            {
                value: DEPOSIT_AMOUNT,
            },
            {
                $$type: "Deposit"
            }
        )

        // WHEN he asks for a withdrawal
        const WITHDRAWAL_AMOUNT = toNano("1")
        const res = await nzComTact.send(
            nonOwner.getSender(),
            {
                value: toNano("0.05")
            },
            {
                $$type: "Withdrawal",
                amount: WITHDRAWAL_AMOUNT
            }
        )

        // THEN there is an unsuccessful transaction reported
        const NON_OWNER_EXIT_CODE = 132
        expect(res.transactions).toHaveTransaction({
            from: nonOwner.address,
            to: nzComTact.address,
            exitCode: NON_OWNER_EXIT_CODE
        })

        // AND the new contract balance is still around the deposited one minus transactions fees
        expect(await nzComTact.getBalance()).toBeGreaterThan(toNano("1.95"))
    })

    test("Should not accept withdrawal if funds are insufficient", async () => {
        // GIVEN we deposit an amount to the contract
        const DEPOSIT_AMOUNT = toNano("1")
        await nzComTact.send(
            deployer.getSender(),
            {
                value: DEPOSIT_AMOUNT,
            },
            {
                $$type: "Deposit"
            }
        )

        // WHEN we ask for a withdrawal of a bigger amount from the contract's owner
        const WITHDRAWAL_AMOUNT = toNano("3")
        const res = await nzComTact.send(
            deployer.getSender(),
            {
                value: toNano("0.05"),
            },
            {
                $$type: "Withdrawal",
                amount: WITHDRAWAL_AMOUNT
            }
        )

        // THEN there is a successful transaction reported
        const INSUFFICIENT_BALANCE_EXIT_CODE = 104
        expect(res.transactions).toHaveTransaction({
            to: nzComTact.address,
            from: deployer.address,
            exitCode: INSUFFICIENT_BALANCE_EXIT_CODE,
        })

        // AND the new contract balance is still around the deposited value fees sent for initial transaction
        expect(await nzComTact.getBalance()).toBeGreaterThan(DEPOSIT_AMOUNT)
    })

    test("Should accept withdrawal from owner", async () => {
        // GIVEN we deposit an amount to the contract
        const DEPOSIT_AMOUNT = toNano("2")
        await nzComTact.send(
            deployer.getSender(),
            {
                value: DEPOSIT_AMOUNT,
            },
            {
                $$type: "Deposit"
            }
        )

        // WHEN we ask for a withdrawal from the contract's owner
        const WITHDRAWAL_AMOUNT = toNano("1")
        const res = await nzComTact.send(
            deployer.getSender(),
            {
                value: toNano("0.05")
            },
            {
                $$type: "Withdrawal",
                amount: WITHDRAWAL_AMOUNT
            }
        )

        // THEN there is a successful transaction reported
        expect(res.transactions).toHaveTransaction({
            from: nzComTact.address,
            to: deployer.address,
            deploy: false,
            success: true,
        })

        // AND the new contract balance is below the deposit amount minus withdrawal amount plus fees sent for transaction
        expect(await nzComTact.getBalance()).toBeLessThan(DEPOSIT_AMOUNT - WITHDRAWAL_AMOUNT + toNano("0.1"))
    })

})
