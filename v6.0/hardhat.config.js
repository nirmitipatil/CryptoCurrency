
require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
const metamask_private_key = "d3f3ac149d97b326d02840aa7df9c2e15f3d8b28cd40f71573089f9b6d8abf20";
const GOERLI_URL = process.env.GOERLI_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/d6e4de3dd62a478487ad4be5c2b83f39",
      accounts: [metamask_private_key],
    },
  },
};
