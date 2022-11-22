const { ethers } = require("hardhat");
require("dotenv").config();
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

  const metadataURL = METADATA_URL;

  const cryptoDevContract = await ethers.getContractFactory("CryptoDev");

  const deployedCryptoDevContract = await cryptoDevContract.deploy(
    metadataURL,
    whitelistContract
  );
  console.log(
    "Crypto Devs Contract Address:",
    deployedCryptoDevContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
