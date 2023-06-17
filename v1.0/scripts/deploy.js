async function main() {
  // Deploying the BasicDutchAuction contract
  const BasicDutchAuction = await ethers.getContractFactory("BasicDutchAuction");
  const basicDutchAuction = await BasicDutchAuction.deploy();

  await basicDutchAuction.deployed();

  console.log("BasicDutchAuction deployed to:", basicDutchAuction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
