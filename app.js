// ===== DYNAMIC HEADER ANIMATIONS =====

// Animate header elements on load
document.addEventListener('DOMContentLoaded', function () {
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
});

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

    e.preventDefault();

    // Remove leading / if present (for links like /#news)
    const cleanHref = href.replace(/^\/#/, '#');
    const target = document.querySelector(cleanHref);

    if (target) {
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
  });
});

// ===== EXTENSION INTEGRATION =====

// Store the extension ID in localStorage for persistence
const STORAGE_KEY_EXT_ID = 'hotel_truth_extension_id';
let currentExtensionId = localStorage.getItem(STORAGE_KEY_EXT_ID) || '';

document.addEventListener('DOMContentLoaded', function () {
  initExtensionIntegration();
});

function initExtensionIntegration() {
  const librarySection = document.getElementById('library');
  if (!librarySection) return;

  const libraryGrid = librarySection.querySelector('.library-grid');
  if (!libraryGrid) return;

  // Create connection UI if no ID is set or if we want to allow changing it
  createConnectionUI(librarySection);

  // If we have an ID, try to fetch data
  if (currentExtensionId) {
    fetchDataFromExtension(currentExtensionId);
  }
}

function createConnectionUI(container) {
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'extension-controls';
  controlsDiv.style.marginBottom = '20px';
  controlsDiv.style.textAlign = 'center';
  controlsDiv.style.padding = '20px';
  controlsDiv.style.background = '#f8f9fa';
  controlsDiv.style.borderRadius = '8px';
  controlsDiv.style.marginTop = '20px';

  controlsDiv.innerHTML = `
    <div style="max-width: 500px; margin: 0 auto;">
      <h3 style="margin-bottom: 10px; font-size: 18px;">Connect to ReviewRadar Extension</h3>
      <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
        To see your analyzed hotels, enter the Extension ID found in chrome://extensions.
        <br>Make sure the extension is installed and running.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <input type="text" id="ext-id-input" placeholder="e.g. abcdefghijklmnop..." value="${currentExtensionId}" 
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; flex: 1; font-family: monospace;">
        <button id="btn-connect" class="cta-button" style="padding: 10px 20px; font-size: 14px; background: #009A8E; color: white; border: none; border-radius: 4px; cursor: pointer;">Sync Data</button>
      </div>
      <div id="connection-status" style="margin-top: 10px; font-size: 14px; min-height: 20px;"></div>
    </div>
  `;

  // Insert before the grid
  const libraryGrid = container.querySelector('.library-grid');
  container.insertBefore(controlsDiv, libraryGrid);

  // Add event listeners
  const btn = document.getElementById('btn-connect');
  const input = document.getElementById('ext-id-input');

  if (btn && input) {
    btn.addEventListener('click', () => {
      const newId = input.value.trim();
      if (!newId) {
        showMessage('Please enter an Extension ID', 'red');
        return;
      }

      currentExtensionId = newId;
      localStorage.setItem(STORAGE_KEY_EXT_ID, newId);
      showMessage('Connecting...', 'blue');
      fetchDataFromExtension(newId);
    });
  }
}

function showMessage(msg, color) {
  const el = document.getElementById('connection-status');
  if (el) {
    el.textContent = msg;
    el.style.color = color;
  }
}

function fetchDataFromExtension(extensionId) {
  if (!window.chrome || !window.chrome.runtime) {
    // If not in a chrome environment with runtime access, we might be limited
    // But typically usually chrome extensions expose this to pages matching externally_connectable
    console.warn('chrome.runtime not detected immediately. It might be available if using externally_connectable matches.');
  }

  // Send message to extension
  try {
    console.log(`Attempting to contact extension: ${extensionId}`);

    // We use the ID to send the message
    chrome.runtime.sendMessage(extensionId, { action: 'getStoredHotels' }, response => {

      // Handle connection errors
      if (chrome.runtime.lastError) {
        console.error('Connection error:', chrome.runtime.lastError);
        showMessage('Connection failed. Verify ID. Is the extension installed?', 'red');
        return;
      }

      if (response && response.hotels) {
        console.log('Received hotels:', response.hotels);
        showMessage(`Successfully synced ${response.hotels.length} hotels!`, 'green');
        renderLibrary(response.hotels);
      } else {
        console.warn('No response or no hotels', response);
        showMessage('Connected, but received no data.', 'orange');
      }
    });
  } catch (e) {
    console.error('Error sending message:', e);
    showMessage(`Error: ${e.message}. Are you using Chrome?`, 'red');
  }
}

function renderLibrary(hotels) {
  const grid = document.querySelector('.library-grid');
  if (!grid) return;

  if (hotels.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 8px;">No hotels analyzed yet. Visit booking.com to analyze some hotels!</div>';
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
