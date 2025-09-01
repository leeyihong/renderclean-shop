require('dotenv').config();
const express = require('express');
const braintree = require('braintree');

const app = express();
app.use(express.static('public'));
app.use(express.json());

//braintree.connect({
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.MERCHANT_ID,
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
});

// Route: Process Payment
app.post('/checkout', async (req, res) => {
  const { amount, paymentMethodNonce } = req.body;

  try {
    const result = await gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (result.success) {
      res.json({ success: true, transaction: result.transaction });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});