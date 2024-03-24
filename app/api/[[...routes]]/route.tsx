/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base,celo } from 'wagmi/chains';
import { PinataFDK } from "pinata-fdk";
import abi from "./abi.json";


const CONTRACT = process.env.CONTRACT_ADDRESS as `0x` || ""
const USDCx = "0xd04383398dd2426297da660f9cca3d439af9ce1b"



const CELOx = "0x671425ae1f272bc6f79bec3ed5c4b00e9c628240"
const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})
const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT || "",
  pinata_gateway: "",
});
// Uncomment to use Edge Runtime
// export const runtime = 'edge'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});


async function getFlowRate(token:any,sender:any,receiver:any) {
  console.log(token,sender,receiver)
  try {
    const flowrate = await publicClient.readContract({
      address: CONTRACT,
      abi: abi,
      functionName: "getFlowrate",
      args:[token,sender,receiver]
    });

    return flowrate;
  } catch (error) {
    console.log(error);
    return error;
  }
}




// app.use(
//   "/ad",
//   fdk.analyticsMiddleware({ frameId: "hats-store", customId: "ad" }),
// );
// app.use(
//   "/finish",
//   fdk.analyticsMiddleware({ frameId: "hats-store", customId: "purchased" }),
// );

app.frame("/", (c) => {
  return c.res({
    action:"/check",
    image:
      "https://dweb.mypinata.cloud/ipfs/QmZPysm8ZiR9PaNxNGQvqdT2gBjdYsjNskDkZ1vkVs3Tju",
    imageAspectRatio: "1:1",
    intents: [
      <TextInput placeholder="Wallet Address (not ens)" />,
      <Button>
        Verify Subscription
      </Button>,
    ],
    title: "Pinta Hat Store",
  });
});
app.frame("/check", async (c) => {
  const sender  = c.inputText
  

  const balance = await getFlowRate(USDCx,sender,"0xD7D98e76FcD14689F05e7fc19BAC465eC0fF4161");
  console.log("balance",balance)

  if (typeof Number(balance) === "number" && Number(balance) === 0) {
    return c.res({
      action:"/finish",
      image:
        "https://dweb.mypinata.cloud/ipfs/QmeeXny8775RQBZDhSppkRN15zn5nFjQUKeKAvYvdNx986",
      imageAspectRatio: "1:1",
      intents: [
        <Button.Transaction target='/subscribe' >
          Subscribe Me
        </Button.Transaction>,
      ],
      title: "Pinta Hat Store - SOLD OUT",
    });
  } else {
    return c.res({
      action: "/finish",
      image:
        "https://dweb.mypinata.cloud/ipfs/QmeC7uQZqkjmc1T6sufzbJWQpoeoYjQPxCXKUSoDrXfQFy",
      imageAspectRatio: "1:1",
      intents: [
        <Button.Transaction target="/buy/0.0005">
          Buy for 0.005 ETH
        </Button.Transaction>,
        <Button action="/ad">Watch ad for 1/2 off</Button>,
      ],
      title: "Pinta Hat Store",
    });
  }
});

app.frame("/finish", async (c) => {
  return c.res({
  action:"/",
    image:
      "https://dweb.mypinata.cloud/ipfs/QmeUmBtAMBfwcFRLdoaCVJUNSXeAPzEy3dDGomL32X8HuP",
    imageAspectRatio: "1:1",
    intents: [
      <Button>Reset</Button>,
    ],
    title: "Pinta Hat Store",
  });
});
// app.frame("/coupon", async (c) => {
//   const supply = await remainingSupply();
//   const address = c.inputText;
//   const balance = await checkBalance(address);

//   if (
//     typeof balance === "number" &&
//     balance < 1 &&
//     typeof supply === "number" &&
//     supply > 0
//   ) {
//     const { request: mint } = await publicClient.simulateContract({
//       account,
//       address: CONTRACT,
//       abi: abi.abi,
//       functionName: "mint",
//       args: [address],
//     });
//     const mintTransaction = await walletClient.writeContract(mint);
//     console.log(mintTransaction);

//     const mintReceipt = await publicClient.waitForTransactionReceipt({
//       hash: mintTransaction,
//     });
//     console.log("Mint Status:", mintReceipt.status);
//   }

//   return c.res({
//     action: "/finish",
//     image:
//       "https://dweb.mypinata.cloud/ipfs/QmeUmBtAMBfwcFRLdoaCVJUNSXeAPzEy3dDGomL32X8HuP",
//     imageAspectRatio: "1:1",
//     intents: [
//       <Button.Transaction target="/buy/0.0025">
//         Buy for 0.0025 ETH
//       </Button.Transaction>,
//     ],
//     title: "Pinta Hat Store",
//   });
// });
app.transaction("/subscribe", async (c) => {
 
const sender = c.inputText
  return c.contract({
    abi: abi,
    // @ts-ignore
    chainId: "eip155:8453",
    functionName: "setFlowrate",
    args: [USDCx,sender,"0xD7D98e76FcD14689F05e7fc19BAC465eC0fF4161",1902587519],
    to: CONTRACT,
  });
});

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
