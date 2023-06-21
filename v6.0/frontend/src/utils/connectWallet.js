import Web3 from "web3";

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length === 0) {
        alert("Please create an account in MetaMask to use this app!");
      } else {
        window.web3 = new Web3(window.ethereum);
      }
    } catch (error) {
      console.error("User denied account access:", error);
    }
  } else {
    alert("Please install MetaMask to use this app!");
  }
};
