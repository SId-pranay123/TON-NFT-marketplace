import * as dotenv from "dotenv";
import { updateMetadataFiles, uploadFolderToIPFS } from "./metadata";
import { openWallet } from "./utils"; 
import { waitSeqno } from "./delay";
import {NftCollection} from "./contracts/NftCollection";
import { readdir } from "fs/promises";
import { toNano } from "ton-core";
import { NftItem } from "./contracts/NftItems";
import { NftMarketplace } from "./contracts/NftMarketplace";
import { GetGemsSaleData, NftSale } from "./contracts/NftSale";

dotenv.config();

async function init() {

  const metadataFolderPath = "./data/metadata/";
  const imagesFolderPath = "./data/images/";

  const wallet = await openWallet(process.env.MNEMONIC!.split(" "), true);

  // console.log("Started uploading images to IPFS...");
  const imagesIpfsHash = "QmTPSH7bkExWcrdXXwQvhN72zDXK9pZzH3AGbCw13f6Lwx"
  // console.log(
    // `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}`
  // );
// 
  // console.log("Started uploading metadata files to IPFS...");
  // await updateMetadataFiles(metadataFolderPath, imagesIpfsHash);
  const metadataIpfsHash = "QmTTmDQWT2jXxCAnwgwYY3rki76hoAGD4H4Xf1KDEGfzsr"
  // console.log(
    // `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`
  // );


  console.log("Start deploy of nft collection...");
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://${metadataIpfsHash}/`,
  };
  const collection = new NftCollection(collectionData);
  let seqno = await wallet.contract.getSeqno() /* = await collection.deploy(wallet); */
  // console.log(`Collection deployed: ${collection.address}`);
  // await waitSeqno(seqno, wallet);

  const files = await readdir(metadataFolderPath);
  console.log(`Start deploy of ${files.length} NFTs`);
  console.log(files)
  let index = 0;
  // seqno = await collection.topUpBalance(wallet, files.length);
  // await waitSeqno(seqno, wallet);
  console.log(`Balance top-upped`);
  console.log(files.length);
  // for (const file of files) {
  //     console.log(`Start deploy of ${index + 1} NFT`);
  //     const mintParams = {
  //       queryId: 0,
  //       itemOwnerAddress: wallet.contract.address,
  //       itemIndex: index,
  //       amount: toNano("0.05"),
  //       commonContentUrl: file,
  //     };
  
  //     const nftItem = new NftItem(collection);
  //     seqno = await nftItem.deploy(wallet, mintParams);
  //     console.log(`Successfully deployed ${index + 1} NFT`);
  //     await waitSeqno(seqno, wallet);  
  //     index++;
  // }



  console.log("Start deploy of new marketplace  ");
  const marketplace = new NftMarketplace(wallet.contract.address);
  // seqno = await marketplace.deploy(wallet);
  // await waitSeqno(seqno, wallet);
  console.log("Successfully deployed new marketplace");

  const nftToSaleAddress = await NftItem.getAddressByIndex(collection.address, 0);
  console.log(`NFT address: ${nftToSaleAddress}`);
  const saleData: GetGemsSaleData = {
    isComplete: false,
    createdAt: Math.ceil(Date.now() / 1000),
    marketplaceAddress: marketplace.address,
    nftAddress: nftToSaleAddress,
    nftOwnerAddress: null,
    fullPrice: toNano("10"),
    marketplaceFeeAddress: wallet.contract.address,
    marketplaceFee: toNano("1"),
    royaltyAddress: wallet.contract.address,
    royaltyAmount: toNano("0.5"),
  };

  const nftSaleContract = new NftSale(saleData);
  try{
    seqno = await nftSaleContract.buy(wallet);
    await waitSeqno(seqno, wallet);
  }catch (e) {
    console.log(e)
  }
  
  console.log("Successfully deployed new sale contract");
  // await NftItem.transfer(wallet, nftToSaleAddress, nftSaleContract.address);


  console.log("Done!");
}




void init();


