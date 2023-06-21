import { ethers } from "ethers";
import React from "react";
import { connectWallet } from "../utils/connectWallet";
import BasicDutchAuction from "../contracts/BasicDutchAuction.sol/BasicDutchAuction.json";

function SubmitBid() {
  const [inputData, setInputData] = React.useState({
    contractAddress: "",
    bidPrice: "",
  });
  const [bidResult, setBidResult] = React.useState("");

  const handleInputChange = (e) => {
    e.preventDefault();
    setInputData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBidResult("Bidding...");
    try {
      await connectWallet();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        inputData.contractAddress,
        BasicDutchAuction.abi,
        signer
      );
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = ethers.BigNumber.from("300000");
      const bidTx = await contract.bid({
        value: parseInt(inputData.bidPrice),
        gasPrice: gasPrice,
        gasLimit: gasLimit,
      });

      const bidResult = await bidTx.wait();
      if (bidResult.status === 1) {
        setBidResult("Bid accepted as the winner");
      } else {
        setBidResult("Bid not accepted");
      }
    } catch (error) {
      setBidResult("Bid not accepted");
      console.error("Error placing bid:", error);
    }
  };

  return (
    <div>
      <label htmlFor="contractAddress">Contract Address</label>
      <input
        id="contractAddress"
        name="contractAddress"
        onChange={handleInputChange}
        value={inputData.contractAddress}
      />
      <br />
      <label htmlFor="bidPrice">Bidding Price</label>
      <input
        id="bidPrice"
        name="bidPrice"
        onChange={handleInputChange}
        value={inputData.bidPrice}
      />
      <br />
      <button type="button" onClick={handleSubmit}>
        Bid
      </button>
      <br />
      <p>{bidResult}</p>
    </div>
  );
}

export default SubmitBid;
