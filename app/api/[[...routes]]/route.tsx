/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { http, createPublicClient } from "viem";

import { base } from 'wagmi/chains';
import { PinataFDK } from "pinata-fdk";
import abi from "./abi.json";


const CONTRACT = process.env.CONTRACT_ADDRESS as `0x` || ""
const USDCx = "0x46fd5cfb4c12d87acd3a13e92baa53240c661d93"
// const folderCid = "QmS9v6hWiEDCWhqRK6YnF7tWjgmy1PEPF4MC4uBVGbFHG8"
// const receiver = "0xD7D98e76FcD14689F05e7fc19BAC465eC0fF4161"
// const flow = ""
// const pages = 7




const app = new Frog({
  assetsPath: '/',
  basePath: `/api`,
  // Supply a Hub to idenable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})
const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT || "",
  pinata_gateway: "https://turquoise-healthy-eel-115.mypinata.cloud",
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

app.frame("/:id", (c) => {
  const id = c.req.param("id")
  return c.res({
    action:`/check/${id}`,
    image:
    (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Verify Your Superfluid Subscription
      </div>
    ),
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
app.frame("/check/:id", async (c) => {
  const sender  = c.inputText
  const id = c.req.param("id")
  const data = await fetch("https://mp7404d75d3a9f171b12.free.beeceptor.com/data")
  const res = await data.json()
  const folder = res.folder
  const pages = res.pages
  const receiver = res.receiver
  const flow = res.flow
  const balance = await getFlowRate(USDCx,sender,receiver);
  console.log("balance",balance)
  
  if (typeof Number(balance) === "number" && Number(balance) === 0) {
    return c.res({
      action:`/start/${folder}/${pages}`,
      image:
      (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Please Subscribe to View
        </div>
      ),
      imageAspectRatio: "1:1",
      intents: [
        <Button.Link href='https://app.superfluid.finance/wrap' >
        Wrap Tokens
      </Button.Link>,
        <Button.Transaction target={`/subscribe/${receiver}/${flow}`} >
          Subscribe Me
        </Button.Transaction>,
      ],
      title: "Pinta Hat Store - SOLD OUT",
    });
  } else{
    return c.res({
      action: `/start/${folder}/${pages}`,
      image:<div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
      Subscription Verified
    </div>
        ,
      imageAspectRatio: "1:1",
      intents: [

        <Button action={`/next/${folder}/${pages}/0`}>Start</Button>,
      ],
      title: "Cover Page",
    });
  }
});
app.frame("/next/:folder/:pages/:no", async (c) => {
  const no = c.req.param("no")
  const folder = c.req.param("folder")
  const pages = c.req.param("pages")

const action = Number(no)<=Number(pages)?`/next/${folder}/${pages}/${Number(no)+1}`:"/finish"
console.log(action)
  return c.res({
  action:action,
    image:`https://turquoise-healthy-eel-115.mypinata.cloud/ipfs/${folder}/${Number(no)}.png`,
    imageAspectRatio: "1:1",
    intents: [
      
      <Button>Next</Button>,
    ],
    title: "Pinta Hat Store",
  });
});
app.frame("/finish", async (c) => {
  
  return c.res({
    image:
    <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
    Finished
  </div>,
    imageAspectRatio: "1:1",
    intents: [
      <Button.Link href='/'>View Profile</Button.Link>,
    ],
    title: "Finish Page",
  });
});

app.transaction("/subscribe/:rec/:flow", async (c) => {
 
const receiver = c.req.param("rec")
const flow = c.req.param("flow")
  return c.contract({
    abi: abi,
    // @ts-ignore
    chainId: "eip155:8453",
    functionName: "setFlowrate",
    args: [USDCx,receiver,flow],
    to: CONTRACT,
  });
});



export const GET = handle(app);
export const POST = handle(app);
devtools(app, { serveStatic })

