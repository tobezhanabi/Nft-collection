// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDev is ERC721Enumerable, Ownable {
  string _baseTokenURI;
  IWhitelist whitelist;
  bool public presaleStarted;
  uint256 public presaleEnded;
  uint256 public maxTokenIds = 20;
  uint256 public tokenIds;
  uint256 public _price = 0.01 ether;
  bool public _paused;

  modifier onlyWhenNotPaused() {
    require(!_paused, "contract currently paused");
    _;
  }

  constructor(string memory baseURI, address whitelistContract)
    ERC721("Crypto Devs", "CD")
  {
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract); // to call the instance of the whitelist dapp contract
  }

  function startPresale() public onlyOwner {
    presaleStarted = true;
    presaleEnded = block.timestamp + 5 minutes;
  }

  function presaleMint() public payable onlyWhenNotPaused {
    require(
      presaleStarted && block.timestamp < presaleEnded,
      "Presale has Ended"
    );
    require(
      whitelist.whitelistedAddresses(msg.sender),
      "You are not in whitelist"
    );
    require(tokenIds < maxTokenIds, "exceeds the max supply");
    require(msg.value >= _price, "Price should be 0.01");
    tokenIds += 1;

    _safeMint(msg.sender, tokenIds);
  }

  function mint() public payable onlyWhenNotPaused {
    require(
      presaleStarted && block.timestamp >= presaleEnded,
      "Presale is not over yet"
    );
    require(tokenIds < maxTokenIds, "Max supply reached");
    require(msg.value >= _price, "Price is suppose to be 0.01");
    tokenIds += 1;
    _safeMint(msg.sender, tokenIds);
  }

  function _baseURI() internal view override returns (string memory) {
    return _baseTokenURI;
  }

  function setPaused(bool val) public onlyOwner {
    _paused = val;
  }

  // to withdraw ethers from contract by owner
  function withdraw() public onlyOwner {
    address _owner = owner();
    uint256 amount = address(this).balance;
    (bool sent, ) = _owner.call{ value: amount }("");
    require(sent, "failed to send ether");
  }

  receive() external payable {}

  fallback() external payable {}
}
