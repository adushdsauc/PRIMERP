// full BankDashboard.jsx with complete layout, modals, and tailwind dropdowns
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { Listbox } from "@headlessui/react";
import { Wallet } from "lucide-react";

export default function BankDashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const civilianId = params.get("civilian");
  console.log("🔍 civilianId from URL:", civilianId);

  const [civilian, setCivilian] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("accounts");

  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [newAccountType, setNewAccountType] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountReason, setAccountReason] = useState("");

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [depositError, setDepositError] = useState("");
const [withdrawError, setWithdrawError] = useState("");

  const personalAccounts = accounts.filter(
    (acc) => !acc.accountType.startsWith("Business")
  );
  const businessAccounts = accounts.filter((acc) =>
    acc.accountType.startsWith("Business")
  );

  const accountTypes = ["Checking", "Savings", "Business Checking", "Business Savings"];

  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  useEffect(() => {
    if (!civilianId) return;
  
    const fetchData = async () => {
      try {
        console.log("📥 Fetching bank data for:", civilianId);
  
        const civRes = await api.get(`/api/civilians/${civilianId}?populate=false`);
        setCivilian(civRes.data.civilian);
  
        const accRes = await api.get(`/api/bank/accounts/${civilianId}`);
        setAccounts(accRes.data);
  
        const txRes = await api.get(`/api/bank/transactions/byCivilian/${civilianId}`);
        setTransactions(txRes.data);
  
        const discordId = civRes.data.civilian.discordId;
        const walletRes = await api.get(`/api/wallet/${discordId}`);
        setWalletBalance(walletRes.data.wallet?.balance || walletRes.data.balance);
  
        setError(""); // clear error
        console.log("✅ All data loaded successfully");
      } catch (err) {
        console.error("❌ Error inside fetchData:", err);
        console.trace();
        setError(err?.response?.data?.error || err?.message || "Unknown error occurred");
      }
    };
  
    fetchData().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchData:", err);
      console.trace();
      setError("An unexpected error occurred during bank data loading.");
    });
  }, [civilianId]);  
  
  const handleCreateAccount = async () => {
    if (!newAccountType) {
      setError("Please select an account type.");
      return;
    }

    let needsApproval = false;
    const existing = accounts.filter(acc => acc.accountType === newAccountType);

    if (newAccountType.startsWith("Business") || existing.length >= 1) {
      if (!accountReason) {
        setError("Please provide a reason for approval.");
        return;
      }
      needsApproval = true;
    }

    try {
      await api.post("/api/bank/create", {
        civilianId,
        accountType: newAccountType,
        reason: accountReason,
        needsApproval
      });
      const updatedAccounts = await api.get(`/api/bank/accounts/${civilianId}`);
      setAccounts(updatedAccounts.data);
      setShowToast(true);
      setSuccess("Account request submitted.");
      setShowAccountModal(false);
      setAccountReason("");
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      setError("Failed to create account.");
    }
  };

  const handleDeposit = async () => {
    const name = civilian?.firstName || "Unknown";
  
    if (walletBalance !== null && parseFloat(transactionAmount) > walletBalance) {
      setDepositError("You do not have enough cash in your wallet.");
      return;
    }
  
  
    try {
      await api.post("/api/bank/deposit", {
        accountId: selectedAccount._id,
        amount: parseFloat(transactionAmount),
        description: `Deposit by ${name}`
      });
  
      setShowDepositModal(false);
      setSuccess(`Deposit of $${transactionAmount} submitted.`);
      setShowToast(true);
      const updatedWallet = await api.get(`/api/wallet/${civilianId}`);
      setWalletBalance(updatedWallet.data.balance);
      setTimeout(() => setShowToast(false), 4000);
      setTransactionAmount("");
      setDepositError("");
    } catch (err) {
      setDepositError(err.response?.data?.error || "Deposit failed.");
    }
  };  

  const handleWithdraw = async () => {
    const name = civilian?.firstName || "Unknown";
  
    try {
      await api.post("/api/bank/withdraw", {
        accountId: selectedAccount._id,
        amount: parseFloat(transactionAmount),
        description: `Withdrawal by ${name}`
      });
  
      setShowWithdrawModal(false);
      setSuccess(`Withdrawal of $${transactionAmount} submitted.`);
      setShowToast(true);
      const updatedWallet = await api.get(`/api/wallet/${civilianId}`);
      setWalletBalance(updatedWallet.data.balance);
      setTimeout(() => setShowToast(false), 4000);
      setTransactionAmount("");
      setWithdrawError("");
    } catch (err) {
      setWithdrawError(err.response?.data?.error || "Withdrawal failed.");
    }
  };  

  const handleTransfer = async () => {
    setError("");
    setSuccess("");
  
    if (!fromAccount) {
      setError("Please select a source account.");
      return;
    }
  
    if (fromAccount.balance < parseFloat(amount)) {
      setError("Insufficient funds in selected account.");
      return;
    }
  
    const from = fromAccount;
    if (!from || from.balance < parseFloat(amount)) {
      setError("Insufficient funds in selected account.");
      return;
    }
  
    try {
      await api.post("/api/bank/transfer", {
        fromAccountId: from._id,
        toAccountNumber: toAccount.trim(), // Ensure this is the number the user typed
        amount: parseFloat(amount),
        description
      });
      
      const updated = await api.get(`/api/bank/transactions/byCivilian/${civilianId}`);
      setTransactions(updated.data);
      setSuccess("Transfer completed successfully.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      setFromAccount(null);
      setToAccount("");
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.error || "Transfer failed.");
    }
  };  

  return (
    <div className="min-h-screen bg-[#101214] text-white flex flex-col">
      {/* TOAST */}
      {showToast && (
        <div className="absolute top-4 right-4 bg-zinc-800 text-white border border-green-500 px-4 py-3 rounded shadow-lg z-50">
          <strong className="block text-green-400">Success</strong>
          <span>{success}</span>
        </div>
      )}
      {/* Create Account Modal */}
{showAccountModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-zinc-900 p-6 rounded shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Create New Bank Account</h2>

      <label className="block mb-2 text-sm font-medium">Account Type</label>
      <Listbox value={newAccountType} onChange={setNewAccountType}>
        <div className="relative mb-4">
          <Listbox.Button className="w-full bg-black border border-gray-700 text-white rounded px-4 py-2 text-left">
            {newAccountType || "-- Select Account Type --"}
          </Listbox.Button>
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-zinc-900 rounded shadow-lg border border-zinc-700 z-10">
            {accountTypes.map((type) => (
              <Listbox.Option
                key={type}
                value={type}
                className={({ active }) =>
                  `cursor-pointer select-none px-4 py-2 ${
                    active ? "bg-red-700 text-white" : "text-white"
                  }`
                }
              >
                {type}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>

      {(newAccountType?.startsWith("Business") ||
        accounts.filter((a) => a.accountType === newAccountType).length >= 1) && (
        <>
          <label className="block mb-2 text-sm font-medium">
            Reason for Request
          </label>
          <textarea
            value={accountReason}
            onChange={(e) => setAccountReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-black border border-gray-700 rounded text-white mb-4"
            placeholder="Explain your reason"
          />
        </>
      )}

      {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowAccountModal(false)}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateAccount}
          className="px-4 py-2 rounded bg-red-700 hover:bg-red-600"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}


{showDepositModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-zinc-900 p-6 rounded shadow-lg w-full max-w-sm">
      <h2 className="text-xl mb-4">Deposit into {selectedAccount?.accountType} #{selectedAccount?.accountNumber}</h2>
      {depositError && <p className="text-red-500 mb-2 text-sm">{depositError}</p>}
      <input
        type="number"
        placeholder="Amount"
        value={transactionAmount}
        onChange={(e) => setTransactionAmount(e.target.value)}
        className="w-full mb-4 px-4 py-2 bg-black border border-gray-700 rounded text-white"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowDepositModal(false)}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleDeposit}
          className="px-4 py-2 rounded bg-green-700 hover:bg-green-600"
        >
          Deposit
        </button>
      </div>
    </div>
  </div>
)}

{showWithdrawModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-zinc-900 p-6 rounded shadow-lg w-full max-w-sm">
      <h2 className="text-xl mb-4">Withdraw from {selectedAccount?.accountType} #{selectedAccount?.accountNumber}</h2>
      {withdrawError && <p className="text-red-500 mb-2 text-sm">{withdrawError}</p>}
      <input
        type="number"
        placeholder="Amount"
        value={transactionAmount}
        onChange={(e) => setTransactionAmount(e.target.value)}
        className="w-full mb-4 px-4 py-2 bg-black border border-gray-700 rounded text-white"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowWithdrawModal(false)}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleWithdraw}
          className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500"
        >
          Withdraw
        </button>
      </div>
    </div>
  </div>
)}
      {/* Header */}
      <header className="flex items-center justify-between bg-zinc-900 border-b border-red-900 px-6 py-3">
        <div className="flex items-center gap-4">
          <img src="/Mazebank.png" alt="Maze Bank" className="h-8" />
          <div className="flex items-center gap-1 text-red-600 font-semibold">
            <Wallet className="w-5 h-5" />
            <span>My Accounts</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-400">Welcome</div>
            <div className="font-bold">{civilian?.firstName} {civilian?.lastName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Wallet Balance</div>
            <div className="font-bold">${walletBalance?.toFixed(2)}</div>
          </div>
          <button onClick={() => navigate('/civilian')} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Exit</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-zinc-950 p-6 overflow-y-auto border-r border-red-900 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-red-500">Personal Accounts</h3>
              <button onClick={() => { setNewAccountType(null); setShowAccountModal(true); }} className="bg-red-600 hover:bg-red-700 text-sm px-2 py-1 rounded">Open</button>
            </div>
            <nav className="space-y-1">
              {personalAccounts.map((acc) => (
                <button key={acc._id} onClick={() => setSelectedAccount(acc)} className={`w-full text-left p-2 rounded ${selectedAccount?._id === acc._id ? 'bg-red-700 text-white' : 'hover:bg-red-900 text-gray-300'}`}>
                  <div className="font-medium">{acc.accountType}</div>
                  <div className="text-xs text-gray-400">#{acc.accountNumber}</div>
                  <div className="text-sm font-semibold">${acc.balance.toFixed(2)}</div>
                </button>
              ))}
            </nav>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-red-500">Business Accounts</h3>
              <button onClick={() => { setNewAccountType(null); setShowAccountModal(true); }} className="bg-red-600 hover:bg-red-700 text-sm px-2 py-1 rounded">Open</button>
            </div>
            <nav className="space-y-1">
              {businessAccounts.map((acc) => (
                <button key={acc._id} onClick={() => setSelectedAccount(acc)} className={`w-full text-left p-2 rounded ${selectedAccount?._id === acc._id ? 'bg-red-700 text-white' : 'hover:bg-red-900 text-gray-300'}`}>
                  <div className="font-medium">{acc.accountType.replace('Business ', '')}</div>
                  <div className="text-xs text-gray-400">#{acc.accountNumber}</div>
                  <div className="text-sm font-semibold">${acc.balance.toFixed(2)}</div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {selectedAccount && (
            <>
              <h1 className="text-2xl font-bold mb-1">{selectedAccount.accountType}</h1>
              <p className="text-3xl font-bold text-green-400 mb-6">${selectedAccount.balance.toFixed(2)}</p>
              <div className="bg-zinc-900 border border-red-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-400">Account Type:</div>
                  <div>{selectedAccount.accountType}</div>
                  <div className="text-gray-400">Account Number:</div>
                  <div>{selectedAccount.accountNumber}</div>
                  <div className="text-gray-400">Available Balance:</div>
                  <div>${selectedAccount.balance.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setShowDepositModal(true)} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded">Deposit Cash</button>
                <button onClick={() => setShowWithdrawModal(true)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded">Withdraw Cash</button>
                <button onClick={() => { setFromAccount(selectedAccount); setActiveTab('transfers'); }} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Transfer Funds</button>
              </div>
              <h2 className="font-semibold mb-2">Recent Transactions</h2>
              <div className="bg-zinc-900 p-4 rounded-lg shadow-lg overflow-x-auto mb-8">
                {transactions.filter((tx) => tx.accountId === selectedAccount._id).slice(0, 10).length === 0 ? (
                  <p className="text-gray-400 italic">No transactions found.</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((tx) => tx.accountId === selectedAccount._id)
                        .slice(0, 10)
                        .map((tx) => (
                          <tr key={tx._id} className="border-b border-gray-800">
                            <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td>{tx.type}</td>
                            <td className={tx.amount < 0 ? 'text-red-400' : 'text-green-400'}>
                              {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                            </td>
                            <td>{tx.description || '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'transfers' && (
            <div className="max-w-xl bg-zinc-900 p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold text-red-400 mb-4">Make a Transfer</h2>
              {error && <p className="text-red-500 mb-2">{error}</p>}
              {success && <p className="text-green-500 mb-2">{success}</p>}
              <label className="block mb-2">From Account</label>
              <Listbox value={fromAccount} onChange={setFromAccount}>
                <div className="relative mb-4">
                  <Listbox.Button className="w-full bg-black border border-gray-700 text-white rounded px-4 py-2 text-left">
                    {fromAccount ? `${fromAccount.accountType} ••••${fromAccount.accountNumber.slice(-4)}` : "-- Select --"}
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-zinc-900 rounded shadow-lg border border-zinc-700 z-10">
                    {accounts.map((acc) => (
                      <Listbox.Option key={acc._id} value={acc} className={({ active }) => `cursor-pointer select-none px-4 py-2 ${active ? 'bg-red-700 text-white' : 'text-white'}`}>
                        {acc.accountType} ••••{acc.accountNumber.slice(-4)} (${acc.balance.toFixed(2)})
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
              <label className="block mb-2">To Account Number</label>
              <input type="text" value={toAccount} onChange={(e) => setToAccount(e.target.value)} className="w-full px-4 py-2 mb-4 bg-black border border-gray-700 rounded" />
              <label className="block mb-2">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2 mb-4 bg-black border border-gray-700 rounded" />
              <label className="block mb-2">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 mb-4 bg-black border border-gray-700 rounded" />
              <button onClick={handleTransfer} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded">Send Transfer</button>
            </div>
          )}
        </main>
      </div>
  );
}
