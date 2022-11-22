import Head from "next/head";
import { providers, utils, Contract } from "ethers";
import { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  const web3ModalRef = useRef();
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
        //using parseEther from utils help us pass value this way
      });
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("You successfully minted a cryptodev NFT");
    } catch (error) {
      console.log(error);
    }
  };
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
        //using parseEther from utils help us pass value this way
      });
      await txn.wait();
      window.alert("You successfully minted a cryptodev NFT");
    } catch (error) {
      console.log(error);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const startPresale = async function () {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.startPresale();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (error) {
      console.log(error);
    }
  };
  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      //presaleEnded will return a uint256 which is a big number in javascript
      // also timestamp is in seconds

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const isPresaleStarted = await nftContract.presaleStarted();

      if (!isPresaleStarted) {
        await getOwner();
      }
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // to gain access to metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to goerli network");
      throw new Error("incorrect network");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async function () {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  // const onPageLoad = async () => {
  //   await connectWallet();
  //   await getOwner();
  //   const presaleStarted = await checkIfPresaleStarted();
  //   if (presaleStarted) {
  //     await checkIfPresaleEnded();
  //   }
  // };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();
      // set an interval that shows up every 5 seconds to check if the presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);
      //set a timer every 5 seconds to get token Id minted
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderBody = function () {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }
    if (loading) {
      return <button className={styles.button}> loading...</button>;
    }
    if (isOwner && !presaleStarted) {
      //render a button when the presale start
      //only available to the deployer
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      //not owner but presale has not started
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later
          </span>
        </div>
      );
    }
    if (presaleStarted && !presaleEnded) {
      //Presale mint is ongoing only for whitelist
      return (
        <div>
          <div className={styles.description}>
            The presale is live for whitelisted peeps
          </div>
          <button onclick={presaleMint} className={styles.button}>
            Presale Mint
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has ended. public is live
          </div>
          <button onClick={publicMint} className={styles.button}>
            Public Mint
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title> Crypto Dev NFT</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> This is Crypto Devs NFT</h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection by developers for developers
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderBody()}
        </div>
        <div>
          <img
            className={styles.image}
            src="/cryptodevs/blockchain-development.png"
          />
        </div>
      </div>

      <footer className={styles.footer}> Made with &#9829; by Tobez </footer>
    </div>
  );
}
