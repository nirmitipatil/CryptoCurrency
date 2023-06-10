pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NFTDutchAuction_ERC20Bids is ERC721Holder {
    struct Auction {
        uint256 reservePrice;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    mapping(address => Auction) public auctions;

    IERC20 public erc20Token;
    IERC721 public erc721Token;
    uint256 public nftTokenId;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;

    event AuctionStarted(address indexed token, uint256 indexed tokenId, uint256 reservePrice, uint256 startTime, uint256 endTime);
    event BidPlaced(address indexed token, uint256 indexed tokenId, address indexed bidder, uint256 bidAmount);
    event AuctionEnded(address indexed token, uint256 indexed tokenId, address indexed winner, uint256 winningBid);

    constructor(
        address _erc20TokenAddress,
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        erc20Token = IERC20(_erc20TokenAddress);
        erc721Token = IERC721(_erc721TokenAddress);
        nftTokenId = _nftTokenId;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        auctions[address(erc20Token)] = Auction({
        reservePrice: _reservePrice,
        startTime: 0,
        endTime: 0,
        highestBidder: address(0),
        highestBid: 0,
        ended: false
        });
    }

    function startAuction() external {
        Auction storage auction = auctions[address(erc20Token)];
        require(auction.endTime == 0, "Auction already exists for the token");

        uint256 startTime = block.number;
        uint256 endTime = startTime + numBlocksAuctionOpen;

        auction.startTime = startTime;
        auction.endTime = endTime;

        emit AuctionStarted(address(erc20Token), nftTokenId, auction.reservePrice, startTime, endTime);
    }


    function placeBid(uint256 bidAmount) external {
        Auction storage auction = auctions[address(erc20Token)];
        require(auction.endTime > 0, "Auction does not exist for the token");
        require(block.number >= auction.startTime, "Auction has not started yet");
        require(block.number <= auction.endTime, "Auction has already ended");
        require(bidAmount > auction.highestBid, "Bid amount must be greater than the current highest bid");

        if (auction.highestBidder != address(0)) {
            // Refund the previous highest bidder
            require(erc20Token.transfer(auction.highestBidder, auction.highestBid), "Failed to refund previous highest bidder");
        }

        // Transfer the bid amount directly from the bidder to the highest bidder
        require(erc20Token.transferFrom(msg.sender, auction.highestBidder, bidAmount), "Failed to transfer bid amount");

        // Update the highest bidder and highest bid
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        emit BidPlaced(address(erc20Token), nftTokenId, msg.sender, bidAmount);
    }


    function endAuction() external {
        Auction storage auction = auctions[address(erc20Token)];
        require(auction.endTime > 0, "Auction does not exist for the token");
        require(!auction.ended, "Auction has already ended");
        require(block.number > auction.endTime, "Auction has not ended yet");

        auction.ended = true;

        if (auction.highestBidder != address(0)) {
            // Transfer the NFT to the highest bidder
            erc721Token.safeTransferFrom(address(this), auction.highestBidder, nftTokenId);
        }

        emit AuctionEnded(address(erc20Token), nftTokenId, auction.highestBidder, auction.highestBid);
    }
}


