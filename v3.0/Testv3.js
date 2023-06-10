const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");




describe("NFTDutchAuction_ERC20Bids", function () {
    let auctionContract;
    let erc20Token;
    let erc721Token;
    let bidder;
    let deployer;
    let bidder1;
    let bidder2;
    let bidder3;
    let nftTokenId;
    let reservePrice;
    let numBlocksAuctionOpen;
    let offerPriceDecrement;

    beforeEach(async function () {
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        erc20Token = await ERC20Mock.deploy("ERC20 Token", "ERC20");
        await erc20Token.deployed();

        const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
        erc721Token = await ERC721Mock.deploy("ERC721 Token", "ERC721");
        await erc721Token.deployed();

        const NFTDutchAuction_ERC20Bids = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        auctionContract = await NFTDutchAuction_ERC20Bids.deploy(
            erc20Token.address,
            erc721Token.address,
            1, // Replace with your desired token ID
            1000, // Replace with your desired reserve price
            100, // Replace with your desired auction duration
            10 // Replace with your desired offer price decrement
        );
        await auctionContract.deployed();

        bidder = await ethers.getSigner(1); // Assuming the bidder is the second signer account
    });

    it("should start the auction", async function () {
        const auctionData = await auctionContract.auctions(erc20Token.address);
        expect(auctionData.reservePrice.toNumber()).to.equal(1000); // Convert BigNumber to number
    });

    it("should retrieve the token name", async function () {
        const tokenName = await erc20Token.name();
        expect(tokenName).to.equal("ERC20 Token");
    });

    it("should return the correct ERC20 token name", async function () {
        const name = await erc20Token.name();
        expect(name).to.equal("ERC20 Token");
    });

    it("should return the correct ERC20 token symbol", async function () {
        const symbol = await erc20Token.symbol();
        expect(symbol).to.equal("ERC20");
    });

    it("should return the correct ERC20 token decimals", async function () {
        const decimals = await erc20Token.decimals();
        expect(decimals).to.equal(18);
    });

    it("should not allow starting the auction if it already exists", async function () {
        // Start the auction
        await auctionContract.startAuction();

        // Try to start the auction again
        try {
            await auctionContract.startAuction();
            // If the above line doesn't throw an exception, fail the test
            expect.fail("Expected an exception to be thrown");
        } catch (error) {
            // Check if the error message matches the expected error message
            expect(error.message).to.include("Auction already exists for the token");
        }
    });

    it("should not allow ending the auction before it has ended", async function () {
        // Start the auction
        await auctionContract.startAuction();

        // Try to end the auction before it has ended
        try {
            await auctionContract.endAuction();
            // If the above line doesn't throw an exception, fail the test
            expect.fail("Expected an exception to be thrown");
        } catch (error) {
            // Check if the error message matches the expected error message
            expect(error.message).to.include("Auction has not ended yet");
        }
    });

    it("should not allow placing a bid with zero amount", async function () {
        // Try to place a bid with zero amount
        try {
            // Perform necessary setup and place a bid with zero amount
            // Replace placeholders with your code
            const zeroAmount = 0;
            await auctionContract.placeBid({ value: zeroAmount });
            // If the above line doesn't throw an exception, fail the test
            expect.fail("Expected an exception to be thrown");
        } catch (error) {
            // Check if the error message matches the expected error message
            expect(error.message).to.include("invalid BigNumber value");
        }
    });

    it("should not allow ending the auction before it has ended", async function () {
        // Start the auction
        await auctionContract.startAuction();

        // Try to end the auction before it has ended
        try {
            await auctionContract.endAuction();
            // If the above line doesn't throw an exception, fail the test
            expect.fail("Expected an exception to be thrown");
        } catch (error) {
            // Check if the error message matches the expected error message
            expect(error.message).to.include("Auction has not ended yet");
        }
    });

});
