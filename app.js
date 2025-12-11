// ===== DYNAMIC HEADER ANIMATIONS =====

function initHeaderAnimations() {
  // Add flexIn class to all animated elements after a short delay
  setTimeout(() => {
    // Animate header title
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
      headerTitle.classList.add('flexIn');
    }

    // Animate all nav items
    const navItems = document.querySelectorAll('.header-nav-item');
    navItems.forEach((item) => {
      item.classList.add('flexIn');
    });

    // Animate CTA button
    const ctaAction = document.querySelector('.header-actions-action');
    if (ctaAction) {
      ctaAction.classList.add('flexIn');
    }

    // Animate burger menu
    const burger = document.querySelector('.header-burger');
    if (burger) {
      burger.classList.add('flexIn');
    }
  }, 100);
}

// ===== SCROLL BEHAVIOR FOR HEADER =====

const header = document.getElementById('header');
let lastScrollTop = 0;
const scrollThreshold = 100; // Start hiding after scrolling 100px

window.addEventListener('scroll', function () {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  // Don't apply hide/show until past threshold
  if (currentScroll < scrollThreshold) {
    header.classList.remove('header-hidden');
    header.classList.remove('scrolled');
    lastScrollTop = currentScroll;
    return;
  }

  // Add scrolled class for styling
  header.classList.add('scrolled');

  // Hide header when scrolling down, show when scrolling up
  if (currentScroll > lastScrollTop && currentScroll > scrollThreshold) {
    // Scrolling down - hide header
    header.classList.add('header-hidden');
  } else if (currentScroll < lastScrollTop) {
    // Scrolling up - show header
    header.classList.remove('header-hidden');
  }

  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

// ===== MOBILE MENU TOGGLE =====

const burgerBtn = document.querySelector('.header-burger-btn');
const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

if (burgerBtn && mobileMenuOverlay) {
  burgerBtn.addEventListener('click', function () {
    burgerBtn.classList.toggle('active');
    mobileMenuOverlay.classList.toggle('active');
    document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu when clicking on a link
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', function () {
      burgerBtn.classList.remove('active');
      mobileMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close menu when clicking outside
  mobileMenuOverlay.addEventListener('click', function (e) {
    if (e.target === mobileMenuOverlay) {
      burgerBtn.classList.remove('active');
      mobileMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// ===== FORM SUBMISSION =====

const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    console.log('Form submitted:', data);

    // Show success message (you'll replace this with actual form handling)
    alert('Thank you for your message! We will get back to you soon.');

    // Reset form
    contactForm.reset();
  });
}

// ===== NEWSLETTER FORM =====

const newsletterForms = document.querySelectorAll('.newsletter-form');

newsletterForms.forEach(form => {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;

    console.log('Newsletter signup:', email);

    alert('Thank you for subscribing!');

    form.reset();
  });
});

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');

    // Don't prevent default for empty hash or just #
    if (href === '#' || href === '/#') return;

    // Remove leading / if present
    const cleanHref = href.replace(/^\/#/, '#');

    // Check if target exists on this page
    try {
      const target = document.querySelector(cleanHref);
      if (target) {
        e.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        if (burgerBtn && mobileMenuOverlay) {
          burgerBtn.classList.remove('active');
          mobileMenuOverlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      // If target doesn't exist, let the browser handle the link (likely navigation to another page)
    } catch (err) {
      // Ignore invalid selectors
    }
  });
});

// ===== EXTENSION INTEGRATION =====

// Store the extension ID in localStorage for persistence
const STORAGE_KEY_EXT_ID = 'unmask_extension_id';
let currentExtensionId = localStorage.getItem(STORAGE_KEY_EXT_ID) || '';
let currentHotels = [];

// ===== INITIALIZE ALL FUNCTIONALITY ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 Page loaded, initializing...');

  // Initialize header animations
  initHeaderAnimations();

  // Initialize extension integration (only on dashboard page)
  if (document.getElementById('library')) {
    initExtensionIntegration();
    setupMessageListener();
  }
});

// Listen for messages from the extension
function setupMessageListener() {
  window.addEventListener('message', function (event) {
    // Only accept messages from same origin for security
    if (event.origin !== window.location.origin) return;

    if (event.data.action === 'hotelDataUpdated' && event.data.hotels) {
      console.log('🔄 Received hotel data update from extension:', event.data.hotels);
      currentHotels = event.data.hotels;
      renderLibrary(currentHotels);
      updateEmptyStates();
      showMessage('✅ Hotel library updated!', 'green');
    }
  });

  // Also listen for chrome runtime messages (if available)
  if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'hotelDataUpdated' && message.hotels) {
        console.log('🔄 Received hotel data update from extension via chrome.runtime:', message.hotels);
        currentHotels = message.hotels;
        renderLibrary(currentHotels);
        updateEmptyStates();
        showMessage('✅ Hotel library updated!', 'green');
        sendResponse({ received: true });
      }
    });
  }
}

function initExtensionIntegration() {
  console.log('🚀 Initializing extension integration...');

  const librarySection = document.getElementById('library');
  if (!librarySection) {
    console.warn('⚠️ Library section not found');
    return;
  }

  const libraryGrid = librarySection.querySelector('.library-grid');
  if (!libraryGrid) {
    console.warn('⚠️ Library grid not found');
    return;
  }

  console.log('✅ Library section and grid found');

  // Create connection UI
  createConnectionUI(librarySection);
  console.log('✅ Connection UI created');

  // If we have an ID, try to fetch data
  if (currentExtensionId) {
    console.log('🔍 Extension ID found in storage:', currentExtensionId);
    fetchDataFromExtension(currentExtensionId);
  } else {
    console.log('📭 No extension ID stored, showing empty state');
    // Show empty state if no extension connected
    renderLibrary([]);
    updateEmptyStates();
  }

  // Try to auto-detect extension ID by attempting connection
  autoDetectExtension();
}

function createConnectionUI(container) {
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'extension-controls';
  controlsDiv.style.marginBottom = '20px';
  controlsDiv.style.textAlign = 'center';
  controlsDiv.style.padding = '20px';
  controlsDiv.style.background = '#f7fafc';
  controlsDiv.style.borderRadius = '8px';
  controlsDiv.style.marginTop = '20px';
  controlsDiv.style.border = '1px solid #e2e8f0';

  controlsDiv.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto;">
      <h3 style="margin-bottom: 10px; font-size: 18px; color: #2d3748;">Extension Connection</h3>
      <p style="margin-bottom: 15px; font-size: 14px; color: #4a5568; line-height: 1.6;">
        Connecting to Unmask extension...
      </p>
      <div id="connection-status" style="margin-top: 12px; font-size: 14px; min-height: 24px; font-weight: 500;"></div>
    </div>
  `;

  // Insert before the grid
  // The container parameter is the library section (#library)
  console.log('createConnectionUI called with:', container);
  console.log('Container ID:', container.id);

  // We need to insert into the .container div inside it, before the .library-grid
  const containerDiv = container.querySelector('.container');
  console.log('Found containerDiv:', containerDiv);

  if (!containerDiv) {
    console.error('Could not find .container div inside library section');
    return;
  }

  const libraryGrid = containerDiv.querySelector('.library-grid');
  console.log('Found libraryGrid:', libraryGrid);
  console.log('libraryGrid parent:', libraryGrid ? libraryGrid.parentNode : 'N/A');
  console.log('containerDiv:', containerDiv);
  console.log('Are they the same?', libraryGrid && libraryGrid.parentNode === containerDiv);

  if (!libraryGrid) {
    console.error('Could not find .library-grid inside container');
    return;
  }

  // Now insert the connection UI before the library grid
  console.log('About to insert connection UI before library grid');
  try {
    containerDiv.insertBefore(controlsDiv, libraryGrid);
    console.log('Connection UI inserted successfully');
  } catch (error) {
    console.error('Error inserting connection UI:', error);
    console.error('controlsDiv:', controlsDiv);
    console.error('libraryGrid:', libraryGrid);
    console.error('containerDiv:', containerDiv);
  }
}

function showMessage(msg, color) {
  const el = document.getElementById('connection-status');
  if (el) {
    el.textContent = msg;
    el.style.color = color;
  }
}

function autoDetectExtension() {
  console.log('Attempting to auto-detect extension...');

  // Method 1: Check if extension injected its ID
  const injectedExtId = document.documentElement.getAttribute('data-unmask-extension-id');
  if (injectedExtId) {
    console.log('Found extension ID from page injection:', injectedExtId);
    currentExtensionId = injectedExtId;
    localStorage.setItem(STORAGE_KEY_EXT_ID, injectedExtId);
    showMessage('Extension detected! Syncing data...', '#009A8E');
    fetchDataFromExtension(injectedExtId);
    return;
  }

  // Method 2: Try to detect by sending a broadcast message
  // This will be caught by the extension's content script
  window.postMessage({ action: 'unmaskDetectionRequest' }, '*');

  // Wait for response
  const detectionTimeout = setTimeout(() => {
    showMessage('Extension not detected. Please install the Unmask extension.', 'orange');
  }, 2000);

  // Listen for extension response
  const responseHandler = (event) => {
    if (event.data.action === 'unmaskDetectionResponse' && event.data.extensionId) {
      clearTimeout(detectionTimeout);
      console.log('Extension auto-detected:', event.data.extensionId);
      currentExtensionId = event.data.extensionId;
      localStorage.setItem(STORAGE_KEY_EXT_ID, event.data.extensionId);
      showMessage('Extension connected successfully!', 'green');
      fetchDataFromExtension(event.data.extensionId);
      window.removeEventListener('message', responseHandler);
    }
  };

  window.addEventListener('message', responseHandler);
}

function fetchDataFromExtension(extensionId) {
  if (!window.chrome || !window.chrome.runtime) {
    showMessage('Chrome extension API not available. Are you using Chrome?', 'orange');
    return;
  }

  // Send message to extension
  try {
    console.log(`Attempting to contact extension: ${extensionId}`);

    // We use the ID to send the message
    chrome.runtime.sendMessage(extensionId, { action: 'getStoredHotels' }, response => {

      // Handle connection errors
      if (chrome.runtime.lastError) {
        console.error('Connection error:', chrome.runtime.lastError);
        showMessage('Connection failed. Extension may not be installed.', 'red');
        updateEmptyStates();
        return;
      }

      if (response && response.success && response.hotels) {
        console.log('Received hotels:', response.hotels);
        currentHotels = response.hotels;
        showMessage(`Successfully synced ${response.hotels.length} hotel${response.hotels.length !== 1 ? 's' : ''}!`, 'green');
        renderLibrary(currentHotels);
        updateEmptyStates();
      } else {
        console.warn('No response or no hotels', response);
        currentHotels = [];
        showMessage('Connected! No hotels analyzed yet.', '#009A8E');
        renderLibrary([]);
        updateEmptyStates();
      }
    });
  } catch (e) {
    console.error('Error sending message:', e);
    showMessage(`Error: ${e.message}`, 'red');
    updateEmptyStates();
  }
}

function renderLibrary(hotels) {
  const grid = document.querySelector('.library-grid');
  if (!grid) return;

  if (hotels.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: white; border-radius: 12px; border: 2px dashed #cbd5e0;">
        <h3 style="font-size: 20px; margin-bottom: 15px; color: #2d3748;">No Hotels Analyzed Yet</h3>
        <p style="color: #718096; margin-bottom: 20px; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
          Start by visiting <strong>Booking.com</strong> and clicking <strong>"Analyze with Unmask"</strong> on any hotel page.
          Your analyzed hotels will automatically appear here!
        </p>
        <div style="display: inline-block; padding: 12px 24px; background: #e6f7f5; color: #009A8E; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Hotels sync automatically once connected
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = hotels.map(hotel => {
    // Calculate deviation status
    const diff = hotel.analysis.adjustedRating - hotel.originalRating;
    let deviationText = 'Accurate rating';
    let devColor = '#718096';

    if (diff < -1.0) { deviationText = 'Major rating inflation detected'; devColor = '#e53e3e'; }
    else if (diff < -0.5) { deviationText = 'Minor rating inflation detected'; devColor = '#dd6b20'; }
    else if (diff > 0.5) { deviationText = 'Better than rated'; devColor = '#38a169'; }

    // Safety check for recommendation
    const recText = hotel.analysis.recommendation ? hotel.analysis.recommendation.split('.')[0] + '.' : 'No recommendation available.';

    return `
    <article class="hotel-card">
      <div class="hotel-image" style="background-color: #e2e8f0; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
        <!-- Use a generic image/placeholder since specific images aren't stored yet -->
        <span style="font-size: 40px;">🏨</span>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; font-size: 12px;">
           ${hotel.location || 'Unknown Location'}
        </div>
      </div>
      <div class="hotel-content">
        <h3 style="margin-bottom: 5px; height: 1.4em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${hotel.hotelName}">${hotel.hotelName}</h3>
        
        <div class="hotel-scores" style="margin-top: 15px;">
          <div class="score-item">
            <span class="score-label">Listed Score:</span>
            <span class="score-value">${hotel.originalRating}</span>
          </div>
          <div class="score-item">
            <span class="score-label">True Score:</span>
            <span class="score-value true-score" style="${getScoreStyle(hotel.analysis.adjustedRating)}">${hotel.analysis.adjustedRating.toFixed(1)}</span>
          </div>
        </div>
        
        <p class="deviation-text" style="font-size: 13px; margin-top: 10px; font-style: italic; color: ${devColor};">
          ${deviationText}
        </p>
        
        <div style="margin-top: 15px; background: #f7fafc; padding: 8px; border-radius: 4px; font-size: 12px; line-height: 1.4; color: #4a5568;">
           "${recText}"
        </div>
        
        <a href="${hotel.url}" target="_blank" style="display: block; margin-top: 15px; text-align: center; font-size: 14px; font-weight: 600; color: #009A8E; text-decoration: none; border: 1px solid #009A8E; padding: 8px; border-radius: 4px; transition: all 0.2s;">
          View on Booking.com
        </a>
      </div>
    </article>
    `;
  }).join('');
}

function getScoreStyle(rating) {
  if (rating >= 8) return 'color: #009A8E; font-weight: bold;';
  if (rating >= 6) return 'color: #d69e2e; font-weight: bold;';
  return 'color: #e53e3e; font-weight: bold;';
}

// Update empty states for comparison section
function updateEmptyStates() {
  const compareEmptyState = document.getElementById('compare-empty-state');

  if (compareEmptyState) {
    // Show empty state if no hotels available
    if (currentHotels.length === 0) {
      compareEmptyState.style.display = 'block';
    } else {
      compareEmptyState.style.display = 'none';
    }
  }
}
