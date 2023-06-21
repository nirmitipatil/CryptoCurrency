import { ethers } from "ethers";
import React from "react";
import BasicDutchAuction from "../contracts/BasicDutchAuction.sol/BasicDutchAuction.json";

function LookupInfo() {
  const [contractAddressInput, setContractAddressInput] = React.useState("");
  const [contractDetails, setContractDetails] = React.useState({});

  const handleInputChange = (e) => {
    e.preventDefault();
    setContractAddressInput(e.target.value);
  };

  const showInfoClickHandler = async (e) => {
    e.preventDefault();
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressInput,
        BasicDutchAuction.abi,
        provider
      );

      const contractDetails = {
        reservePrice: await contract.reservePrice(),
        numBlocksAuctionOpen: await contract.numBlocksAuctionOpen(),
        offerPriceDecrement: await contract.offerPriceDecrement(),
        currentMinimumBidPrice: await contract.getCurrentPrice(),
        auctionStatus: await contract.auctionEnded(),
        initialPrice: await contract.initialPrice(),
        buyer: await contract.buyer(),
      };

      setContractDetails(contractDetails);
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setContractDetails(null);
    }
  };

  return (
    <div>
      <label htmlFor="contractAddressInput">Enter Contract Address</label>
      <input
        id="contractAddressInput"
        name="contractAddressInput"
        onChange={handleInputChange}
        value={contractAddressInput}
      />
      <br />
      <button type="button" onClick={showInfoClickHandler}>
        Show Info
      </button>
      <br />
      <p>Reserve Price: {contractDetails?.reservePrice?.toString()}</p>
      <p>Num of Blocks: {contractDetails?.numBlocksAuctionOpen?.toString()}</p>
      <p>Price Decrement: {contractDetails?.offerPriceDecrement?.toString()}</p>
      <p>
        Current Minimum bid to win:{" "}
        {contractDetails?.currentMinimumBidPrice?.toString()}
      </p>
        <p>
            Initial price:{" "}
            {contractDetails?.initialPrice?.toString()}
        </p>
      <p>
        Auction Status:
        {contractDetails?.auctionStatus === true ? "Ended" : "Ongoing"}{" "}
      </p>
      <p>
        Winner:{" "}
        {contractDetails?.buyer?.localeCompare(ethers?.constants?.AddressZero) === 0
          ? "No winner yet"
          : contractDetails?.buyer}{" "}
      </p>
    </div>
  );
}

export default LookupInfo;
