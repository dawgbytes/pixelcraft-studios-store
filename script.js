// Shopping Cart Functionality
let cart = [];
let cartTotal = 0;

// Initialize Stripe (you'll need to replace with your actual publishable key)
const stripe = Stripe('pk_test_your_publishable_key_here');

// Cart Functions
function addToCart(productId, price) {
    const product = getProductInfo(productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: price,
            quantity: 1,
            size: getSelectedSize(productId),
            color: getSelectedColor(productId)
        });
    }
    
    updateCartDisplay();
    showCartNotification();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    // Update cart count
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart items
    cartItems.innerHTML = '';
    cartTotal = 0;
    
    cart.forEach(item => {
        cartTotal += item.price * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Size: ${item.size} | Color: ${item.color}</p>
                <p>Qty: ${item.quantity}</p>
            </div>
            <div class="cart-item-price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Update total
    cartTotalElement.textContent = cartTotal.toFixed(2);
}

function getProductInfo(productId) {
    const products = {
        'entangled-tshirt': { name: 'Quantum Entanglement T-Shirt' },
        'superposition-tshirt': { name: 'Superposition T-Shirt' },
        'quantum-leap-mug': { name: 'Quantum Leap Mug' },
        'entangled-hoodie': { name: 'Quantum Entanglement Hoodie' }
    };
    return products[productId] || { name: 'Unknown Product' };
}

function getSelectedSize(productId) {
    const sizeSelect = document.getElementById(productId.replace('-', '-') + '-size');
    return sizeSelect ? sizeSelect.value : 'M';
}

function getSelectedColor(productId) {
    const colorSelect = document.getElementById(productId.replace('-', '-') + '-color');
    return colorSelect ? colorSelect.value : 'white';
}

function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.toggle('active');
}

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function showCartNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = 'Item added to cart!';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Checkout Function
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    try {
        // Create checkout session with your backend
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: cart,
                total: cartTotal
            })
        });
        
        const session = await response.json();
        
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
            console.error('Error:', result.error);
            alert('There was an error processing your payment. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error processing your payment. Please try again.');
    }
}

// Printful Integration Functions
async function createPrintfulOrder(orderData) {
    const response = await fetch('https://api.printful.com/orders', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_PRINTFUL_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    });
    
    return response.json();
}

// Product Data for Printful
const printfulProducts = {
    'entangled-tshirt': {
        variant_id: 71, // Gildan 5000 Unisex Heavy Cotton Tee
        files: [
            {
                placement: 'front',
                image_url: 'https://your-domain.com/designs/entangled_tshirt_front.png'
            }
        ]
    },
    'superposition-tshirt': {
        variant_id: 71,
        files: [
            {
                placement: 'front',
                image_url: 'https://your-domain.com/designs/superposition_tshirt_front.png'
            }
        ]
    },
    'quantum-leap-mug': {
        variant_id: 4011, // White Ceramic Mug
        files: [
            {
                placement: 'default',
                image_url: 'https://your-domain.com/designs/quantum_leap_mug.png'
            }
        ]
    },
    'entangled-hoodie': {
        variant_id: 71, // Gildan 18500 Unisex Heavy Blend Hoodie
        files: [
            {
                placement: 'front',
                image_url: 'https://your-domain.com/designs/entangled_hoodie_front.png'
            }
        ]
    }
};

// Convert cart to Printful order format
function convertCartToPrintfulOrder(cart, customerInfo) {
    const items = cart.map(item => {
        const product = printfulProducts[item.id];
        if (!product) return null;
        
        return {
            variant_id: product.variant_id,
            quantity: item.quantity,
            files: product.files
        };
    }).filter(item => item !== null);
    
    return {
        external_id: `order_${Date.now()}`,
        shipping: 'STANDARD',
        recipient: {
            name: customerInfo.name,
            address1: customerInfo.address1,
            city: customerInfo.city,
            state_code: customerInfo.state,
            country_code: customerInfo.country,
            zip: customerInfo.zip
        },
        items: items
    };
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Close cart modal when clicking outside
    const cartModal = document.getElementById('cart-modal');
    cartModal.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            toggleCart();
        }
    });
    
    // Initialize cart display
    updateCartDisplay();
});

// Free Store Setup Instructions
function showSetupInstructions() {
    const instructions = `
    FREE STORE SETUP INSTRUCTIONS:
    
    1. HOSTING (FREE):
       - Use GitHub Pages (completely free)
       - Upload your files to a GitHub repository
       - Enable GitHub Pages in repository settings
       - Your store will be live at: https://yourusername.github.io/repository-name
    
    2. DOMAIN (FREE OPTIONS):
       - Use GitHub Pages subdomain (free)
       - Use Freenom for free .tk/.ml/.ga domains
       - Use Cloudflare for free DNS management
    
    3. PAYMENT PROCESSING (FREE UNTIL PROFITABLE):
       - Stripe: No monthly fees, only 2.9% + 30¢ per transaction
       - PayPal: No monthly fees, similar transaction fees
       - Square: No monthly fees, similar transaction fees
    
    4. PRINTFUL INTEGRATION (FREE):
       - Free account with Printful
       - Only pay when orders are placed
       - Automatic fulfillment and shipping
    
    5. SETUP STEPS:
       a. Create GitHub account
       b. Create new repository
       c. Upload store files
       d. Enable GitHub Pages
       e. Set up Printful account
       f. Configure webhooks
       g. Test order process
    
    TOTAL COST: $0 until you start making sales!
    `;
    
    alert(instructions);
}

// Call setup instructions on page load
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment the line below to show setup instructions
    // showSetupInstructions();
});
