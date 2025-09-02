require('dotenv').config();
const express = require('express');
const braintree = require('braintree');

// For customer data storage
const fs = require('fs');
const path = require('path');
const CUSTOMERS_FILE = path.join(__dirname, 'data', 'customers.json');

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

// Ensure data directory and file exist
if (!fs.existsSync(path.dirname(CUSTOMERS_FILE))) {
  fs.mkdirSync(path.dirname(CUSTOMERS_FILE), { recursive: true });
}
if (!fs.existsSync(CUSTOMERS_FILE)) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify([]));
}

// Read customers from file
function readCustomers() {
  const data = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write customers to file
function writeCustomers(customers) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

function clearCustomers() {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify([], null, 2));
}

// Search customer by email
async function findCustomerByEmail(email) {
    try {
        const stream = gateway.customer.search((search) => {
            search.email().is(email);
        });

        return new Promise((resolve, reject) => {
            const customers = [];
            stream.on('data', (customer) => customers.push(customer));
            stream.on('end', () => resolve(customers));
            stream.on('error', (err) => reject(err));
        });
    } catch (err) {
        throw new Error(`Search failed: ${err.message}`);
    }
}


// Customer registration (Check if exist and create)
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, company } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // let customer = await searchCustomers(email);
    let customers = await findCustomerByEmail(email);
    console.log('Customers found with email ', email, customers);
    let customer = customers[0] ?? null;
    let customerId = customer ? customer.id : null;
    console.log('Existing customer :', customer, " and id ", customerId);

    const existing = !!customerId;

    if (!existing) { // Create new customer
        try {
            const result = await gateway.customer.create({
                firstName,
                lastName,
                email,
                phone: phone || undefined,
                company: company || undefined,
            });

            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message });
            }

            customerId = result.customer.id;

            // Save to local storage (simulate DB)
            clearCustomers(); // For demo, keep only latest
            const localCustomers = readCustomers();
            localCustomers.push({ 
                id: customerId, 
                firstName: firstName, 
                lastName: lastName, 
                email: email, 
                phone: phone, 
                company: company 
            });
            writeCustomers(localCustomers);

        } catch (err) {
            console.error('Braintree customer creation failed:', err);
            return res.status(500).json({ success: false, message: 'Failed to create customer' });
        }
    } else {
        // Existing customer - update local storage to ensure sync
        clearCustomers(); // For demo, keep only latest
        const localCustomers = readCustomers();
        localCustomers.push({ 
                id: customer.id, 
                firstName: customer.firstName, 
                lastName: customer.lastName, 
                email: customer.email, 
                phone: customer.phone, 
                company: customer.company 
            });
        writeCustomers(localCustomers);
    }

    return res.json({
        success: true,
        customerId,
        email,
        message: existing ? 'Welcome back!' : 'Registration complete.',
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});