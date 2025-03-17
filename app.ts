import express from 'express';
import cors from 'cors';
import { depositToEscrow, releaseFunds, depositToPaymster ,transferETH,refund} from './deploy/sendETH';
import loadFundsToAccount from './deploy/loadFundsToAccount';
import deploy from './deploy/deploy';
import { parseEther } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to deploy the BasicAccount contract
app.post('/api/deploy', async (req, res) => {
  try {
    console.log('Starting smart contract deployment...');
    let result = await deploy();
    res.status(200).json({ 
      success: true, 
      message: 'Smart contract deployed successfully' ,
      data: result.data
    });
  } catch (error:any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deploying smart contract', 
      error: error.message 
    });
  }
});

// API endpoint to load funds to a smart account
app.post('/api/load-funds', async (req :any, res:any) => {
  try {
    const { smartAccountAddress, amount } = req.body;
    
    if (!smartAccountAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: smartAccountAddress and amount'
      });
    }
    
    const amountInWei = parseEther(amount.toString());
    const result:any = await loadFundsToAccount(smartAccountAddress, amountInWei);
    
    return res.status(result.code).json({
        success: result.status,
        message: result.message,
        data: result.data
      });
    
  } catch (error:any) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading funds to smart account',
      error: error.message
    });
  }
});

// API endpoint to deposit to escrow
app.post('/api/deposit-to-escrow', async (req :any, res:any) => {
  try {
    const { sender, amount, receiver } = req.body;
    
    if (!sender || !amount || !receiver) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: sender, amount, and receiver'
      });
    }
    
    const result = await depositToEscrow(sender, amount, receiver);
    
      return res.status(result.code).json({
        success: result.status,
        message: result.message,
        data: result.data
      });
    
  } catch (error:any) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error depositing to escrow',
      error: error.message
    });
  }
});

// API endpoint to release funds
app.post('/api/release-funds', async (req :any, res:any) => {
  try {
    const { sender, receiver } = req.body;
    
    if (!sender || !receiver) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: sender and receiver'
      });
    }
    
    const result = await releaseFunds(sender, receiver);
    
    return res.status(result.code).json({
        success: result.status,
        message: result.message,
        data: result.data
      });
    
  } catch (error:any) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error releasing funds',
      error: error.message
    });
  }
});


app.post('/api/transfer', async (req :any, res:any) => {
    try {
        const { sender, amount, receiver } = req.body;
    
        if (!sender || !amount || !receiver) {
          return res.status(400).json({
            success: false,
            message: 'Missing required parameters: sender, amount, and receiver'
          });
        }
      const result = await transferETH(sender, receiver,amount);
      
      return res.status(result.code).json({
          success: result.status,
          message: result.message,
          data: result.data
        });
      
    } catch (error:any) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error tranferring ETH',
        error: error.message
      });
    }
  });


  app.post('/api/refund', async (req :any, res:any) => {
    try {
        const { sender, amount, receiver } = req.body;
    
        if (!sender  || !receiver) {
          return res.status(400).json({
            success: false,
            message: 'Missing required parameters: sender, amount, and receiver'
          });
        }
      const result = await refund(sender, receiver);
      
      return res.status(result.code).json({
          success: result.status,
          message: result.message,
          data: result.data
        });
      
    } catch (error:any) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error in refunding',
        error: error.message
      });
    }
  });

// API endpoint to deposit to paymaster
app.post('/api/deposit-to-paymaster', async (req :any, res:any) => {
  try {
    let result = await depositToPaymster();
    
    return res.status(result.code).json({
        success: result.status,
        message: result.message
      });
    
  } catch (error:any) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error depositing to paymaster',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
