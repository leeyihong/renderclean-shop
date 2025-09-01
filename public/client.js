const products = [
    {
        id: 1,
        name: "All-Purpose Cleaner",
        description: "A powerful, streak-free cleaner for any surface.",
        price: 8.99,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=All-Purpose+Cleaner"
    },
    {
        id: 2,
        name: "Microfiber Cloths",
        description: "Set of 5 absorbent and reusable cloths for dusting and spills.",
        price: 12.50,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=Microfiber+Cloths"
    },
    {
        id: 3,
        name: "Floor Cleaner",
        description: "Leaves your floors sparkling clean with a fresh lemon scent.",
        price: 15.00,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=Floor+Cleaner"
    },
    {
        id: 4,
        name: "Glass Cleaner",
        description: "Ammonia-free formula for a crystal-clear finish on glass and mirrors.",
        price: 7.99,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=Glass+Cleaner"
    },
    {
        id: 5,
        name: "Disinfecting Wipes",
        description: "Convenient wipes that kill 99.9% of germs.",
        price: 9.25,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=Disinfecting+Wipes"
    },
    {
        id: 6,
        name: "Sponge Scrubbers",
        description: "Heavy-duty sponges with a scouring side for tough messes.",
        price: 5.50,
        image: "https://placehold.co/400x300/e2e8f0/64748b?text=Sponge+Scrubbers"
    }
];                  

const productsContainer = document.getElementById('products-container');
const cartContainer = document.getElementById('cart-container');
const cartItemsList = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const donationInput = document.getElementById('donation-amount');
const addDonationBtn = document.getElementById('add-donation-btn');

const checkoutModal = document.getElementById('checkout-modal');
const summaryView = document.getElementById('summary-view');
const paymentView = document.getElementById('payment-view');
const modalContent = document.getElementById('modal-content');
const addMoreBtn = document.getElementById('add-more-btn');
const paymentBtn = document.getElementById('payment-btn');
const paymentTotalSpan = document.getElementById('payment-total');
const backToSummaryBtn = document.getElementById('back-to-summary-btn');
let cart = {};

// For braintree payment
const dropinDiv = document.getElementById('dropin-container');
const button = document.getElementById('purchase-btn'); 
const statusDiv = document.getElementById('status');
let instance;


// Function to render the product cards
function renderProducts() {
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4">
            <h3 class="text-xl font-semibold text-gray-800 text-center">${product.name}</h3>
            <p class="text-gray-600 text-sm mt-2 text-center">${product.description}</p>
            <p class="text-2xl font-bold text-gray-900 my-4">$${product.price.toFixed(2)}</p>
            <div class="flex items-center justify-center w-full space-x-2">
                <input type="number" id="qty-${product.id}" value="1" min="1" class="w-16 border border-gray-300 p-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button data-id="${product.id}" class="add-to-cart-btn flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                    Add to Cart
                </button>
            </div>
        `;
        productsContainer.appendChild(card);
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const quantity = parseInt(document.getElementById(`qty-${productId}`).value);
            addToCart(productId, quantity);
        });
    });
}

// Function to add a product to the cart
function addToCart(productId, quantity) {
    const product = products.find(p => p.id == productId);
    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = { ...product, quantity: quantity };
    }
    updateCartUI();
}

// Function to handle the donation
addDonationBtn.addEventListener('click', () => {
    const donationAmount = parseFloat(donationInput.value);
    if (donationAmount > 0) {
        cart.donation = {
            name: "Goodwill Donation",
            price: donationAmount,
            quantity: 1
        };
    } else {
        delete cart.donation;
    }
    updateCartUI();
});

// Function to update the cart UI and total
function updateCartUI() {
    cartItemsList.innerHTML = '';
    let total = 0;
    let hasItems = false;

    for (const productId in cart) {
        hasItems = true;
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const li = document.createElement('li');
        li.className = 'py-4 flex items-center justify-between';
        li.innerHTML = `
            <div>
                <p class="text-gray-900 font-medium">${item.name} <span class="text-sm font-normal text-gray-500">x${item.quantity}</span></p>
                <p class="text-gray-500 text-sm">$${item.price.toFixed(2)} each</p>
            </div>
            <span class="text-gray-900 font-semibold">$${itemTotal.toFixed(2)}</span>
        `;
        cartItemsList.appendChild(li);
    }

    if (hasItems) {
        cartContainer.classList.remove('hidden');
        checkoutBtn.disabled = false;
    } else {
        cartContainer.classList.add('hidden');
        checkoutBtn.disabled = true;
    }
    cartTotalSpan.textContent = total.toFixed(2);
}

// Function to show the checkout modal
checkoutBtn.addEventListener('click', () => {
    console.log("Checkout button clicked");
    modalContent.innerHTML = '';
    let finalTotal = 0;

    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        finalTotal += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex justify-between items-center pb-2 border-b border-gray-200';
        itemDiv.innerHTML = `
            <p class="font-medium text-gray-800">${item.name}</p>
            <p class="text-gray-700">$${itemTotal.toFixed(2)}</p>
        `;
        modalContent.appendChild(itemDiv);
    }

    if (Object.keys(cart).length === 0) {
        modalContent.innerHTML = `<p class="text-center text-lg text-gray-500">Your cart is empty!</p>`;
    } else {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'flex justify-between items-center font-bold text-xl mt-4 pt-4 border-t-2 border-gray-300';
        totalDiv.innerHTML = `
            <p class="text-gray-900">Final Total</p>
            <p class="text-green-600">$${finalTotal.toFixed(2)}</p>
        `;
        modalContent.appendChild(totalDiv);
    }

    checkoutModal.classList.remove('hidden');
    summaryView.classList.remove('hidden');
    paymentView.classList.add('hidden');
});

// "Add More Items" button closes the modal
addMoreBtn.addEventListener('click', () => {
    console.log("Add More Items button clicked");
    checkoutModal.classList.add('hidden');
});

// "Payment" button shows the payment view
paymentBtn.addEventListener('click', () => {
    console.log("Payment button clicked");
    const totalText = document.getElementById('cart-total').textContent;
    paymentTotalSpan.textContent = totalText;
    initDropin();
    summaryView.classList.add('hidden');
    paymentView.classList.remove('hidden');
});

// "Back to Summary" button shows the summary view
backToSummaryBtn.addEventListener('click', () => {
    console.log("Back to Summary button clicked");
    statusDiv.innerHTML = '';
    if(backToSummaryBtn.textContent === "Close") {
        checkoutModal.classList.add('hidden');
        cart = {};
        updateCartUI();
        backToSummaryBtn.textContent = "Back to Summary";
        return;
    }
    paymentView.classList.add('hidden');
    summaryView.classList.remove('hidden');
});

// Initialize Drop-in
async function initDropin() {
    console.log("initDropin called");
  try {
    dropinDiv.innerHTML = '';
    instance = await braintree.dropin.create({
      authorization: "sandbox_gkvzkrp2_b3h4jt8pnjpprn22",	//clientToken,
      container: dropinDiv,
    });

    button.style.visibility = 'visible';
    button.disabled = false;
    button.textContent = 'Pay Now';
    button.onclick = handlePayment;

    console.log("Requesting dropin with instance:", instance);

  } catch (err) {
    console.error('Error initializing Drop-in:', err);
    statusDiv.innerHTML = `<p style="color: red">Failed to load payment form.</p>`;
  }
}

// Handle payment submission
async function handlePayment() {
  console.log("handlePayment called");
  button.disabled = true;
  button.textContent = 'Processing...';

  const amount = paymentTotalSpan.textContent;

  console.log("Amount to be paid:", amount);
  if (!amount || isNaN(amount) || amount <= 0) { //To check if amount is a valid number
    statusDiv.innerHTML = `<p style="color: red">Please enter a valid amount.</p>`;
    button.disabled = false;
    return;
  }

  try {
    console.log("Requesting payment method... with instance:", instance);
    const { nonce } = await instance.requestPaymentMethod(); 
    console.log("Payment nonce received:", nonce);
    const res = await fetch('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethodNonce: nonce }),
    });
    console.log("Payment response received:", res);

    const result = await res.json();

    if (result.success) {
      statusDiv.innerHTML = `
        <p style="color: green">
          ✅ Payment successful!<br/>
          Transaction ID: ${result.transaction.id}<br/>
          Amount: $${result.transaction.amount}
        </p>`;
        button.style.visibility = 'hidden'
        backToSummaryBtn.textContent = "Close";
    } else {
        statusDiv.innerHTML = `<p style="color: red">❌ ${result.message || 'Payment failed'}</p>`;

        button.disabled = false;
        button.textContent = 'Pay Now';
    }
  } catch (err) {
    console.error('Payment error:', err);
    statusDiv.innerHTML = `<p style="color: red">❌ Payment failed due to network or server error.</p>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Pay Now';
  }
}

// On page load
document.addEventListener('DOMContentLoaded', renderProducts);