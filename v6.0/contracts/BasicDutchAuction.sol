// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract BasicDutchAuction {
    address payable public seller; // Address of the seller
    uint256 public reservePrice; // Minimum price set by seller
    uint256 public numBlocksAuctionOpen; // Number of blocks the auction runs for
    uint256 public offerPriceDecrement; // Price decrease with each block
    uint256 public initialPrice; // Initial price of the item
    uint256 public auctionEndTime; // Block number when the auction ends
    uint256 public startingblock; // Block number when the auction ends
    bool public auctionEnded; // Flag indicating whether auction has ended
    address public winningBidder; // Winning bidder address
    address public buyer; //Address of the buyer

    // Mapping to store bids by address
    mapping(address => uint256) public bids;

    // defining constructor
    constructor(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;

        // Calculate initial price and auction end time
        initialPrice =
            reservePrice +
            numBlocksAuctionOpen *
            offerPriceDecrement;
        auctionEndTime = block.number + numBlocksAuctionOpen;
        startingblock = block.number;
        auctionEnded = false;
    }

    // Function for bidding
    function bid() public payable {
        require(!auctionEnded && (block.number < auctionEndTime), "Auction has already ended");
        require(msg.value >= getCurrentPrice(), "Bid amount is too low");

        // Store the bid amount for the sender
        // payable(msg.sender).transfer(msg.value);
        bids[msg.sender] = msg.value;
        buyer = msg.sender;

        // Check if the bid amount is greater than or equal to the initial price
        if (msg.value >= initialPrice) {
            endAuction();
        }
    }

    // Calculate current price based on the remaining blocks
    function getCurrentPrice() public view returns (uint256) {
        require(block.number < auctionEndTime, "Auction is closed");
        uint256 currentBlock = block.number;
        uint256 blocksRemaining = auctionEndTime - currentBlock;
        uint256 currentPrice = initialPrice - (currentBlock * offerPriceDecrement);

        // Check for current price less than reserve price
        if (currentPrice < reservePrice) {
            return reservePrice;
        }

        return currentPrice;
    }

    // End the auction
    function endAuction() private {
        auctionEnded = true;
        winningBidder = msg.sender;

        // Refund all other bidders
        for (uint256 i = 0; i < auctionEndTime; i++) {
            address bidder = tx.origin;
            if (bidder != winningBidder) {
                uint256 amount = bids[bidder];
                if (amount > 0) {
                    bids[bidder] = 0;
                    payable(bidder).transfer(amount);
                }
            }
        }

        // Transfer bid amount to seller
        uint256 winningBidAmount = bids[winningBidder];
        if (winningBidAmount > 0) {
            bids[winningBidder] = 0;
            seller.transfer(winningBidAmount);
        }
    }
}
