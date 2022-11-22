// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const tokenId = req.query.tokenId;

  const name = `Crypto Dev # ${tokenId}`;
  const description = "CryptoDev is an NFT collection for web 3 developers";
  const image = `https://raw.githubusercontent.com/tobezhanabi/Nft-collection/main/my-app/public/cryptodevs/${tokenId}.svg`;

  return res.json({
    name: name,
    description: description,
    image: image,
  });
}
