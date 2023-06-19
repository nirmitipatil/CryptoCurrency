async function submitBid(auction, bidAmount) {
  // Get the current nonce for the bidder.
  let nonce = auction.getNonce(msg.sender);

  // Create a permit transaction.
  let permitTransaction = auction.permit(
    msg.sender,
    auction.address,
    bidAmount,
    block.timestamp + 10000,
    eth.accounts[0].sign(
      auction.getDomainSeparator() +
        bidAmount +
        nonce +
        block.timestamp +
        10000
    ),
    eth.accounts[0].publicAddress
  );

  // Send the permit transaction.
  let permitHash = await permitTransaction.sendTransaction({ from: msg.sender });

  // Wait for the permit transaction to be mined.
  let receipt = await web3.eth.waitForTransactionReceipt(permitHash);

  // Update the auction's highest bid.
  auction.highestBid = bidAmount;
  auction.highestBidder = msg.sender;
}
