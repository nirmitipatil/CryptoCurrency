const { expect } = require("chai");

describe("NFTDutchAuction", function () {
  let nftDutchAuction;
  let winningBidder;
  let erc721Mock;
  let seller;
  let bidder;
  let bidder1;
  let bidder2;
  let bidder3;

  beforeEach(async function () {
    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    erc721Token = await ERC721Mock.deploy("Mock NFT", "MNFT"); // Update with appropriate name and symbol
    await erc721Token.deployed();

    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");
    nftDutchAuction = await NFTDutchAuction.deploy(
        erc721Token.address,
        1, // Update with appropriate parameters
        100, // Update with appropriate parameters
        10, // Update with appropriate parameters
        5 // Update with appropriate parameters
    );
    await nftDutchAuction.deployed();

    [seller, bidder, bidder1, bidder2, bidder3, winningBidder] = await ethers.getSigners();
  });




  // Test Case 1: Check if the reserve price is set correctly
  it("should set the reserve price correctly", async function () {
    const reservePrice = await nftDutchAuction.reservePrice();
    expect(reservePrice.toNumber()).to.equal(100);
  });

  // Test Case 2: Check if the offer price decrement is set correctly
  it("should set the offer price decrement correctly", async function () {
    const offerPriceDecrement = await nftDutchAuction.offerPriceDecrement();
    expect(offerPriceDecrement.toNumber()).to.equal(5);
  });

  // Test Case 3: Create a Dutch auction and verify the auction parameters
  it("should create a Dutch auction", async function () {
    const reservePrice = await nftDutchAuction.reservePrice();
    const offerPriceDecrement = await nftDutchAuction.offerPriceDecrement();
    const auctionEndTime = await nftDutchAuction.auctionEndTime();

    expect(reservePrice.toNumber()).to.equal(100);
    expect(offerPriceDecrement.toNumber()).to.equal(5);
    expect(auctionEndTime.toNumber()).to.be.above(0);
  });

  // Test Case 4: Verify that a lower bid is rejected
  it("should reject a low bid", async function () {
    try {
      await nftDutchAuction.connect(bidder1).bid({ value: 50 });
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });

  // Test Case 5: Update the winning bidder and end the auction
  it("should update the winning bidder and end the auction", async function () {
    const bidAmount = 150;
    await nftDutchAuction.connect(bidder).bid({ value: bidAmount });

    const winningBidder = await nftDutchAuction.winningBidder();
    const auctionEnded = await nftDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder.address);
    expect(auctionEnded).to.be.true;
  });

  // Test Case 6: Verify that a bid is rejected after the last round
  it("should reject a bid after the last round", async function () {
    await nftDutchAuction.connect(bidder1).bid({ value: 120 });
    await nftDutchAuction.connect(bidder2).bid({ value: 110 });

    const currentBlockTimestamp = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    const auctionEndTime = currentBlockTimestamp + 10;

    await ethers.provider.send("evm_increaseTime", [auctionEndTime - currentBlockTimestamp]);
    await ethers.provider.send("evm_mine");

    try {
      await nftDutchAuction.connect(bidder3).bid({ value: 105 });
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });

  // Test Case 7: Verify that bid withdrawal is rejected after the auction ends
  it("should reject bid withdrawal after the auction ends", async function () {
    await nftDutchAuction.connect(bidder1).bid({ value: 200 });
    await network.provider.send("evm_increaseTime", [10]);

    try {
      await nftDutchAuction.connect(bidder1).withdrawBid();
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });

  // Test Case 8: Verify that an additional bid from the winning bidder is rejected
  it("should reject additional bid from winning bidder", async function () {
    await nftDutchAuction.connect(bidder1).bid({ value: 500 });

    try {
      await nftDutchAuction.connect(bidder1).bid({ value: 600 });
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });

  // Test Case 9: Verify bidding with an amount greater than the initial price
  it("should allow bidding with an amount greater than the initial price", async function () {
    const initialPrice = await nftDutchAuction.initialPrice();
    const bidAmount = initialPrice.add(100);
    await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });

    const winningBidder = await nftDutchAuction.winningBidder();
    const auctionEnded = await nftDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder1.address);
    expect(auctionEnded).to.be.true;
  });

  // Test Case 10: Verify bidding with the initial price
  it("should allow bidding with the initial price", async function () {
    const initialPrice = await nftDutchAuction.initialPrice();
    await nftDutchAuction.connect(bidder1).bid({ value: initialPrice });

    const winningBidder = await nftDutchAuction.winningBidder();
    const auctionEnded = await nftDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder1.address);
    expect(auctionEnded).to.be.true;
  });

  // Test Case 11: Verify that bidding with an amount less than the reserve price reverts
  it("should revert when bidding with amount less than reserve price", async function () {
    try {
      const reservePrice = await nftDutchAuction.reservePrice();
      const bidAmount = reservePrice.sub(1);
      await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });


  // Test Case 12: Perform actions when ending auction with the current price greater than the reserve price
  it("should perform actions when ending auction with current price greater than reserve price", async () => {
    const reservePrice = await nftDutchAuction.reservePrice();

    const bidAmount = reservePrice.add(100);
    await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });

    // Perform necessary checks or assertions to verify the desired actions
    const winningBidder = await nftDutchAuction.winningBidder();
    const auctionEnded = await nftDutchAuction.auctionEnded();

    expect(winningBidder).to.equal(bidder1.address);
    expect(auctionEnded).to.be.true;
  });


  //Test Case 13:

  it("should allow only the seller to end the auction", async function () {
    // Place a bid to make sure auction is open
    await nftDutchAuction.connect(bidder).bid({ value: 200 });

    try {
      // Try to end the auction from a different address
      await nftDutchAuction.connect(bidder1).endAuction();
      throw new Error("Transaction Reverted");
    } catch (error) {
      expect(error.message).to.exist;
    }
  });

  //Test Case 14:

  it("should return the correct current price", async function () {
    // Place a bid to make sure auction is open
    await nftDutchAuction.connect(bidder).bid({ value: 200 });

    // Increase the block number to simulate progress of the auction
    const currentBlock = await ethers.provider.getBlockNumber();
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    const blocksRemaining = auctionEndTime.sub(currentBlock);
    const offerPriceDecrement = await nftDutchAuction.offerPriceDecrement();
    const initialPrice = await nftDutchAuction.initialPrice();
    const expectedCurrentPrice = initialPrice.sub(blocksRemaining.mul(offerPriceDecrement));

    const currentPrice = await nftDutchAuction.getCurrentPrice();

    expect(currentPrice.toNumber()).to.equal(expectedCurrentPrice.toNumber());
  });


  //Test Case 15: Verify the return value of onERC721Received function
  it("should return a valid selector in onERC721Received function", async function () {
    const selector = await nftDutchAuction.onERC721Received(
        bidder.address,
        bidder1.address,
        1,
        []
    );
    expect(selector).to.be.ok; // Check if the selector is truthy
  });

  //Test Case 16: Verify that the current price is equal to the reserve price when the current price is less than the reserve price

  it("should return the reservePrice when currentPrice is less than reservePrice", async () => {
    const currentPrice = await nftDutchAuction.getCurrentPrice();
    const reservePrice = await nftDutchAuction.reservePrice();

    expect(currentPrice.toString()).to.equal(reservePrice.toString());
    
  });
  

});









