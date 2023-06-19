// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NFTDutchAuction_ERC20Bids is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Auction {
        uint256 reservePrice;
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;
        address payable highestBidder;
        bool ended;
    }

    mapping(address => Auction) public auctions;

    IERC721Upgradeable public erc721Token;
    IERC20Upgradeable public erc20Token;
    mapping(address => uint256) public nonces;

    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    string public constant PERMIT_VERSION = "1";

    event AuctionStarted(address indexed erc20Token, uint256 indexed tokenId, uint256 reservePrice, uint256 startTime, uint256 endTime);
    event BidPlaced(address indexed erc20Token, uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed erc20Token, uint256 indexed tokenId, address highestBidder, uint256 highestBid);

    function initialize(IERC721Upgradeable _erc721Token, IERC20Upgradeable _erc20Token) external initializer {
        __Ownable_init();
        erc721Token = _erc721Token;
        erc20Token = _erc20Token;
    }

    function startAuction(
        uint256 tokenId,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    ) external {
        require(erc721Token.ownerOf(tokenId) == msg.sender, "Only token owner can start the auction");
        require(reservePrice > 0, "Reserve price must be greater than zero");
        require(endTime > startTime, "End time must be greater than start time");
        require(auctions[address(erc20Token)].endTime == 0, "Auction already in progress for this token");

        erc721Token.safeTransferFrom(msg.sender, address(this), tokenId);
        auctions[address(erc20Token)] = Auction({
        reservePrice: reservePrice,
        startTime: startTime,
        endTime: endTime,
        highestBid: 0,
        highestBidder: payable(address(0)),
        ended: false
        });

        emit AuctionStarted(address(erc20Token), tokenId, reservePrice, startTime, endTime);
    }

    function placeBid(uint256 tokenId, uint256 bidAmount) external {
        Auction storage auction = auctions[address(erc20Token)];
        require(auction.startTime <= block.timestamp, "Auction has not started yet");
        require(!auction.ended, "Auction has ended");
        require(bidAmount > auction.highestBid, "Bid amount must be greater than current highest bid");
        require(bidAmount >= auction.reservePrice, "Bid amount must be greater than or equal to reserve price");

        if (auction.highestBidder != address(0)) {
            erc20Token.safeTransfer(auction.highestBidder, auction.highestBid);
        }

        erc20Token.safeTransferFrom(msg.sender, address(this), bidAmount);

        auction.highestBid = bidAmount;
        auction.highestBidder = payable(msg.sender);

        emit BidPlaced(address(erc20Token), tokenId, msg.sender, bidAmount);
    }

    function endAuction(uint256 tokenId) external {
        Auction storage auction = auctions[address(erc20Token)];
        require(auction.endTime <= block.timestamp, "Auction has not ended yet");
        require(!auction.ended, "Auction has already ended");

        auction.ended = true;
        erc721Token.safeTransferFrom(address(this), auction.highestBidder, tokenId);

        emit AuctionEnded(address(erc20Token), tokenId, auction.highestBidder, auction.highestBid);
    }

    // ERC20 permit functions
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "Permit expired");
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", getDomainSeparator(), keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))));
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == owner, "Invalid signature");
        _approve(owner, spender, value);
    }

    function getNonce(address owner) external view returns (uint256) {
        return nonces[owner];
    }

    function getDomainSeparator() public view returns (bytes32) {
        return keccak256(abi.encode(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"), keccak256(bytes("NFTDutchAuction_ERC20Bids")), keccak256(bytes(PERMIT_VERSION)), block.chainid, address(this)));
    }

    function _approve(
        address owner,
        address spender,
        uint256 value
    ) internal {
        IERC20Upgradeable(erc20Token).approve(spender, value);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
