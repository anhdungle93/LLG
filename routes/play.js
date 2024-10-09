var express = require('express');
var util = require('../config/util.js');
var router = express.Router();
const ethers = require('ethers');
const { getContractWithSigner } = require('../utils/interact');
const { llgContractAddress, llgContractABI } = require('../utils/contractInfo');

router.get('/', function(req, res) {
    res.render('partials/play', {
        title: 'Chess Hub - Game',
        user: req.user,
        isPlayPage: true
    });
});

// Modify the POST route to handle LLG token transfer
router.post('/transfer', async function(req, res) {
    try {
        // Ensure the user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Extract transfer amount, user's wallet address, and recipient address from request body
        const { amount, walletAddress, recipientAddress } = req.body;

        // Validate the amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid transfer amount' });
        }

        // Get the LLG contract instance
        const llgContract = getContractWithSigner(llgContractAddress, llgContractABI);

        // Perform the transfer
        const tx = await llgContract.transfer(recipientAddress, ethers.utils.parseEther(amount.toString()), {
            from: walletAddress
        });

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            // Respond with success message and game token
            res.status(200).json({
                message: 'Transfer successful',
                amount: amount,
                recipientAddress: recipientAddress,
                transactionHash: receipt.transactionHash
            });
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;