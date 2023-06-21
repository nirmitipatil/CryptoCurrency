import { ethers } from "ethers";
import React from "react";
import { connectWallet } from "../utils/connectWallet";
import BasicDutchAuction from "../contracts/BasicDutchAuction.sol/BasicDutchAuction.json";
import { AppContext } from "../context/AppContext";

function AuctionDeployment() {
  const [auctionInputs, setAuctionInputs] = React.useState({
    reservePrice: "",
    numBlocksAuctionOpen: "",
    offerPriceDecrement: "",
  });

  const [contractAddress, setContractAddress] = React.useState("");

  const handleInputChange = (e) => {
    e.preventDefault();
    setAuctionInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await connectWallet();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const factory = new ethers.ContractFactory(
        BasicDutchAuction.abi,
        BasicDutchAuction.bytecode,
        signer
      );
      const contract = await factory.deploy(
        parseInt(auctionInputs.reservePrice),
        parseInt(auctionInputs.numBlocksAuctionOpen),
        parseInt(auctionInputs.offerPriceDecrement)
      );
      await contract.deployed();
      setContractAddress(contract.address);
    } catch (error) {
      console.error("Error deploying auction:", error);
    }
  };

  return (
    <AppContext.Provider value={{ contractAddress }}>
      <div>
        <label htmlFor="reservePrice">Reserve Price</label>
        <input
          id="reservePrice"
          name="reservePrice"
          onChange={handleInputChange}
          value={auctionInputs.reservePrice}
        />
        <br />
        <label htmlFor="numBlocksAuctionOpen">Number of blocks</label>
        <input
          id="numBlocksAuctionOpen"
          name="numBlocksAuctionOpen"
          onChange={handleInputChange}
          value={auctionInputs.numBlocksAuctionOpen}
        />
        <br />
        <label htmlFor="offerPriceDecrement">
          Price decrease with each block
        </label>
        <input
          id="offerPriceDecrement"
          name="offerPriceDecrement"
          onChange={handleInputChange}
          value={auctionInputs.offerPriceDecrement}
        />
        <br />
        <button type="button" onClick={handleSubmit}>
          Deploy
        </button>
        <br />
        <p>Contract Address: {contractAddress}</p>
      </div>
    </AppContext.Provider>
  );
}

export default AuctionDeployment;
