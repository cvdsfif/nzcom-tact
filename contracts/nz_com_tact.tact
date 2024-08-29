import "@stdlib/deploy";
import "@stdlib/ownable";

message Deposit { }

message Withdrawal {
    amount: Int as coins
}

const INSUFFICIENT_BALANCE_EXIT_CODE : Int = 104;

contract NzComTact with Deployable, Ownable {
    id: Int as int32;
    owner: Address;
    override const storageReserve : Int = ton("0.09");
    
    init(id: Int) {
        self.id = id;
        self.owner = sender();
    }

    receive(_: Deposit) {
        // Simply accept the deposit
    }

    receive(withdrawal: Withdrawal) {
        self.requireOwner();
        nativeThrowUnless(INSUFFICIENT_BALANCE_EXIT_CODE, withdrawal.amount < myBalance() - self.storageReserve);
        send(SendParameters{
            to: sender(),
            value: withdrawal.amount,
            mode: SendRemainingValue | SendIgnoreErrors
        })
    }

    get fun balance(): Int {
        return myBalance();
    }

    get fun id(): Int {
        return self.id;
    }
}
