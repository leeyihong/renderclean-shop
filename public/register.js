const cusStatus = document.getElementById('cus-status');
const linkCusId = document.getElementById('link-cus-id');

document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    firstName: document.getElementById('first-name').value,
    lastName: document.getElementById('last-name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    company: document.getElementById('company').value,
  };

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    console.log(result);

    if (result.success) {
      // Save local session (simulate login)
      localStorage.setItem('customerId', result.customerId);
      localStorage.setItem('customerEmail', result.email);

      // Redirect to checkout
      //window.location.href = 'index.html';
    
      cusStatus.innerHTML = `${result.message} Your Customer ID: <strong>${result.customerId}</strong>`;
      linkCusId.textContent = `← Back to Checkout as customer (${result.customerId})`;
    } else {
      alert('Registration failed: ' + (result.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Network error. Please try again.');
  }
});