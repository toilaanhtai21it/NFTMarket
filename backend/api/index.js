import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import pinataSDK from "@pinata/sdk";
import { Readable } from "stream";
import { ethers } from "ethers";

// Config constants
const pinataJWTKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlN2E2ODJiMi1jM2UzLTRkODYtYWVkNi0zOWY5YmE5NmI1MzgiLCJlbWFpbCI6InRhaW5kYS4yMWl0QHZrdS51ZG4udm4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZThmNTJjNmIzOTFhOWZlMGU0MTciLCJzY29wZWRLZXlTZWNyZXQiOiJkODkzODJhNTY0YjIyYTUxN2E5NWQ5YTdkOTYwYTNmOTMzNWVlNzdjMGE4NDA0NTFhOTMzOWRmYTMwMGYxYTJlIiwiZXhwIjoxNzc3NDcxNTI4fQ.cZu67Q00Ukw66qZugsoF3dL4tDKuxgNH2enmy1d4zn4";
const PRIVATE_KEY = "d89382a564b22a517a95d9a7d960a3f9335ee77c0a840451a9339dfa300f1a2e";
const SEPOLIA_URL = "https://sepolia.infura.io/v3/b982b822219149e2a6d7d82a0a75e91f";

const app = express();
const PORT = process.env.PORT || 8001;

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Pinata SDK init
const pinata = new pinataSDK({ pinataJWTKey: pinataJWTKey });

pinata.testAuthentication()
  .then(() => console.log("✅ Pinata authenticated"))
  .catch((err) => console.error("❌ Pinata auth failed:", err));

// Ethereum wallet init
const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Routes
app.get("/", (req, res) => res.send("✅ Express server running"));

// Upload JSON to IPFS
app.post("/uploadJsonToIpfs", async (req, res) => {
  try {
    const result = await pinata.pinJSONToIPFS(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error uploading JSON:", err);
    res.status(500).json({ error: "Failed to upload JSON to IPFS" });
  }
});

// Upload Image to IPFS
app.post("/uploadImageToIpfs", upload.single("image"), async (req, res) => {
  try {
    const readableStream = Readable.from(req.file.buffer);
    const options = {
      pinataMetadata: { name: req.file.originalname },
    };
    const result = await pinata.pinFileToIPFS(readableStream, options);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error uploading image:", err);
    res.status(500).json({ error: "Failed to upload image to IPFS" });
  }
});

// Send ETH (test)
app.post("/sendEth", async (req, res) => {
  const { address } = req.body;
  const amount = "0.0001";

  try {
    const tx = {
      to: address,
      value: ethers.parseEther(amount),
    };

    const transaction = await wallet.sendTransaction(tx);
    await transaction.wait();

    res.status(200).json({ txHash: transaction.hash, amount });
  } catch (error) {
    console.error("❌ Send ETH failed:", error);
    res.status(500).json({ error: "Transaction failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

export default app;
