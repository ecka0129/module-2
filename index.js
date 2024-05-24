import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [showInfo, setShowInfo] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts && accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balanceBigNumber = await atm.getBalance();
      setBalance(balanceBigNumber.toString());
    }
  };

  const deposit = async () => {
    if (atm && depositAmount !== "") {
      try {
        const amount = ethers.utils.parseUnits(depositAmount, 18); // Parse the input to 18 decimal units
        let tx = await atm.deposit(amount, { gasLimit: 500000 });
        await tx.wait();
        getBalance();
        setDepositAmount(""); // Reset the deposit amount input field
        addToTransactionHistory(`Deposited ${depositAmount} ETH`);
      } catch (error) {
        if (error.code === ethers.errors.UNPREDICTABLE_GAS_LIMIT) {
          console.error("Unpredictable gas limit:", error.message);
        } else {
          console.error("Deposit failed:", error);
        }
      }
    }
  };

  const withdraw = async () => {
    if (atm && withdrawAmount !== "") {
      try {
        const amount = ethers.utils.parseUnits(withdrawAmount, 18); // Parse the input to 18 decimal units
        let tx = await atm.withdraw(amount, { gasLimit: 500000 });
        await tx.wait();
        getBalance();
        setWithdrawAmount(""); // Reset the withdraw amount input field
        addToTransactionHistory(`Withdrawn ${withdrawAmount} ETH`);
      } catch (error) {
        if (error.code === ethers.errors.UNPREDICTABLE_GAS_LIMIT) {
          console.error("Unpredictable gas limit:", error.message);
        } else {
          console.error("Withdraw failed:", error);
        }
      }
    }
  };

  const addToTransactionHistory = (transaction) => {
    setTransactionHistory([...transactionHistory, transaction]);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount}>Click to Connect</button>
      );
    }

    if (balance == undefined) {
      getBalance();
    }

    return (
      <div>
        <button onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? "Hide" : "Show"} Account Info
        </button>
        {showInfo && (
          <div>
            <p>Your Account: {account}</p>
            <p>Your Balance: {balance}</p>
          </div>
        )}
        <input
          type="text"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Deposit Amount"
        />
        <button onClick={deposit}>Deposit</button>
        <input
          type="text"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Withdraw Amount"
        />
        <button onClick={withdraw}>Withdraw</button>
        <div>
          <h2>Transaction History</h2>
          <ul>
            {transactionHistory.map((transaction, index) => (
              <li key={index}>{transaction}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>بنك الإمارات</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}
