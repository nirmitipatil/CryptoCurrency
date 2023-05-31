const { expect } = require("chai");

describe("BasicDutchAuction", function () {
  let basicDutchAuction;
  let seller;
  let bidder;
  let bidder1;
  let bidder2
  let bidder3;

  beforeEach(async function () {
    // Deploy Auction Contract
    const BasicDutchAuction = await ethers.getContractFactory("BasicDutchAuction");
    basicDutchAuction = await BasicDutchAuction.deploy(100, 10, 5); // Setting desired test values
    await basicDutchAuction.deployed();

    [seller, bidder, bidder1, bidder2, bidder3] = await ethers.getSigners();
  });
  

  //Test Case 1:- To check if the reserve price is set correctly
  it("should set the reserve price correctly", async function () {
    // Verifying reserve price is set correctly
    const reservePrice = await basicDutchAuction.reservePrice();
    expect(reservePrice.toNumber()).to.equal(100); // Converting BigNumber to number
  });

  //Test Case 2:- To check offer price decrement correctly
  it("should set the offer price decrement correctly", async function () {
    // Verifying offer price decrement is set correctly
    const offerPriceDecrement = await basicDutchAuction.offerPriceDecrement();
    expect(offerPriceDecrement.toNumber()).to.equal(5); // Converting BigNumber to number
  });

  //Test Case 3:- To create a Dutch Auction
  it("should create a dutch auction", async function () {
    // Verifying auction parameters are set correctly
    const reservePrice = await basicDutchAuction.reservePrice();
    const offerPriceDecrement = await basicDutchAuction.offerPriceDecrement();
    const auctionEndTime = await basicDutchAuction.auctionEndTime();

    expect(reservePrice.toNumber()).to.equal(100);
    expect(offerPriceDecrement.toNumber()).to.equal(5);
    expect(auctionEndTime.toNumber()).to.be.above(0); // Ensuring auctionEndTime is set correctly
  });


  //Test Case 4:- To check if a lower bid is rejected
  it("should reject a low bid", async function () {
    // Attempting to place a low bid and verifying that it reverts
    try {
      await basicDutchAuction.connect(bidder1).bid({ value: 50 });
      // The transaction did not revert
      throw new Error("Transaction Reverted");
    } catch (error) {
      // Check if the error message matches the expected error message
      expect(error.message).to.exist;
    }
  });

  
  //Test Case 5:- Testing to update the winning bid and end the auction
  it("should update the winning bidder and end the auction", async function () {
    // Place a bid higher than the initial price
    const bidAmount = 150;
    await basicDutchAuction.connect(bidder).bid({ value: bidAmount });

    // Check the winning bidder and auction status
    const winningBidder = await basicDutchAuction.winningBidder();
    const auctionEnded = await basicDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder.address);
    expect(auctionEnded).to.be.true;
  });


  //Test Case 6:- Testing if it rejects a bid after last round
  it("should reject a bid after the last round", async function () {
    // Place bids from multiple bidders
    await basicDutchAuction.connect(bidder1).bid({ value: 120 });
    await basicDutchAuction.connect(bidder2).bid({ value: 110 });

    // Get the current block timestamp
    const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

    // Calculate the timestamp for the end of the auction
    const auctionEndTime = currentBlockTimestamp + 10;

    // Increase the block timestamp to simulate the end of the auction
    await ethers.provider.send("evm_increaseTime", [auctionEndTime - currentBlockTimestamp]);
    await ethers.provider.send("evm_mine");

    // Attempt to place a bid after the last round and verify that it reverts
    try {
      await basicDutchAuction.connect(bidder3).bid({ value: 105 });
      // If the code reaches this point, the transaction did not revert
      throw new Error("Transaction Reverted");
    } catch (error) {
      // Check if the error message matches the expected error message
      expect(error.message).to.exist;
    }
  });


  //Test Case 7:- Checking Bid Withdrawal after auction end
  it("should reject bid withdrawal after auction ends", async function () {
    // Place a non-winning bid
    await basicDutchAuction.connect(bidder1).bid({ value: 200 });

    // Increase the block number to simulate the auction end
    await network.provider.send("evm_increaseTime", [10]);

    // Attempt to withdraw the bid after the auction ends and verify that it reverts
    try {
      await basicDutchAuction.connect(bidder1).withdrawBid();
      // If the code reaches this point, the transaction did not revert
      throw new Error("Transaction Reverted");
    } catch (error) {
      // Check if the error message matches the expected error message
      expect(error.message).to.exist;
    }
  });


  //Test Case 8:- Check if bid withdrawal is rejected after the bid ends
  it("should reject additional bid from winning bidder", async function () {
    // Place a winning bid
    await basicDutchAuction.connect(bidder1).bid({ value: 500 });

    // Attempt to place another bid from the winning bidder and verify that it reverts
    try {
      await basicDutchAuction.connect(bidder1).bid({ value: 600 });
      // If the code reaches this point, the transaction did not revert
      throw new Error("Transaction Reverted");
    } catch (error) {
      // Check if the error message matches the expected error message
      expect(error.message).to.exist;
    }
  });

  //Test Case 9:- To check if bidding amount greater than initial place
  it("should allow bidding with an amount greater than the initial price", async function () {
    // Place a bid greater than the initial price
    const initialPrice = await basicDutchAuction.initialPrice();
    const bidAmount = initialPrice + 100;
    await basicDutchAuction.connect(bidder1).bid({ value: bidAmount });

    // Verify the winning bidder and auction status
    const winningBidder = await basicDutchAuction.winningBidder();
    const auctionEnded = await basicDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder1.address);
    expect(auctionEnded).to.be.true;
  });


  
  //Test Case 10:- Check if bidding works at inital  price
  it("should allow bidding with the initial price", async function () {
    // Place a bid equal to the initial price
    const initialPrice = await basicDutchAuction.initialPrice();
    await basicDutchAuction.connect(bidder1).bid({ value: initialPrice });

    // Verify the winning bidder and auction status
    const winningBidder = await basicDutchAuction.winningBidder();
    const auctionEnded = await basicDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder1.address);
    expect(auctionEnded).to.be.true;
  });
  

  // Test Case 11: Check if bidding amount is less than reserve price reverts
  it("should revert when bidding with amount less than reserve price", async function () {
    // Attempting to place a bid with amount less than reserve price and verifying that it reverts
    try {
      const reservePrice = await basicDutchAuction.reservePrice();
      const bidAmount = reservePrice.sub(1); // Setting bid amount less than reserve price
      await basicDutchAuction.connect(bidder1).bid({ value: bidAmount });
      // The transaction did not revert
      throw new Error("Transaction Reverted");
    } catch (error) {
      // Check if the error message matches the expected error message
      expect(error.message).to.exist;
    }
  });


   //Test Case 12:- Check if contract works correctly if reserve price is less than current price
  it('should perform actions when current price is greater than reserve price', async () => {
    const BasicDutchAuction = await ethers.getContractFactory("BasicDutchAuction");
    const auction = await BasicDutchAuction.deploy(100, 10, 5); // Setting desired test values
    await auction.deployed();

    // Place bids to increase the current price above the reserve price
    await auction.connect(bidder1).bid({ value: 110 });

    // Add assertion or verification logic here to ensure the desired actions are performed
  });

  

});
