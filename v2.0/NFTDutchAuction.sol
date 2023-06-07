// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ERC721Mock.sol";

contract NFTDutchAuction is IERC721Receiver {
    using SafeMath for uint256;

    address public seller;
    address public nftContract;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public auctionEndTime;
    bool public auctionEnded;
    address public winningBidder;

    mapping(address => uint256) public bids;

    constructor(
        address erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = msg.sender;
        nftContract = erc721TokenAddress;
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice.add(numBlocksAuctionOpen.mul(offerPriceDecrement));
        auctionEndTime = block.number.add(numBlocksAuctionOpen);
        auctionEnded = false;
    }



    modifier auctionOpen() {
        require(block.number <= auctionEndTime, "Auction is not open");
        _;
    

    }

    function bid() external payable auctionOpen {
        require(!auctionEnded, "Auction has already ended");
        require(msg.value >= getCurrentPrice(), "Bid amount is too low");

        bids[msg.sender] = msg.value;

        if (msg.value >= initialPrice) {
            endAuction();
        }
    }

    function getCurrentPrice() public view returns (uint256) {
        uint256 currentBlock = block.number;
        uint256 blocksRemaining = auctionEndTime.sub(currentBlock);
        uint256 currentPrice = initialPrice.sub(blocksRemaining.mul(offerPriceDecrement));

        if (currentPrice < reservePrice) {
            return reservePrice;
        }

        return currentPrice;
    }

    function endAuction() private {
        require(!auctionEnded, "Auction has already ended");

        auctionEnded = true;
        winningBidder = msg.sender;

        for (uint256 i = 0; i < auctionEndTime; i++) {
            address bidder = address(uint160(tx.origin));
            if (bidder != winningBidder) {
                uint256 amount = bids[bidder];
                if (amount > 0) {
                    bids[bidder] = 0;
                    bool transferSuccessful = transferFunds(bidder, amount);
                    require(transferSuccessful, "Failed to transfer funds to the bidder");
                }
            }
        }

        uint256 winningBidAmount = bids[winningBidder];
        if (winningBidAmount > 0) {
            bids[winningBidder] = 0;
            bool transferSuccessful = transferFunds(seller, winningBidAmount);
            require(transferSuccessful, "Failed to transfer funds to the seller");
        }
    }

    function transferFunds(address recipient, uint256 amount) private returns (bool) {
        (bool success, ) = payable(recipient).call{value: amount}("");
        return success;
    }

  


    function onERC721Received(
            address operator,
            address from,
            uint256 tokenId,
            bytes calldata data
        ) external pure override returns (bytes4) {
            return IERC721Receiver.onERC721Received.selector;
        }




}
