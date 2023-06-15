// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NFTDutchAuction_ERC20BidsProxy is UUPSUpgradeable {
    // Storage variables
    address private _implementation;

    // Initialize function
    function initialize(address implementation) public initializer {
        _implementation = implementation;
    }

    // Function to authorize an upgrade
    function _authorizeUpgrade(address newImplementation) internal view override {
        require(_implementation != newImplementation, "Proxy: new implementation should be different");
    }

    // Function to upgrade to a new implementation
    function upgradeTo(address newImplementation) public override {
        _upgradeTo(newImplementation);
    }

    // Fallback function to delegate calls to the implementation contract
    fallback() external payable {
        _delegate(_implementation);
    }

    // Receive function to delegate calls to the implementation contract
    receive() external payable {
        _delegate(_implementation);
    }

    // Internal function to delegate calls to the implementation contract
    function _delegate(address implementation) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
