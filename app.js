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

    // console.log('Form submitted:', data);

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

    // console.log('Newsletter signup:', email);

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
let currentFilters = {
  search: '',
  destination: 'all',

  sortBy: 'date-newest'
};

// ===== INITIALIZE ALL FUNCTIONALITY ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function () {
  console.log('Page loaded, initializing...');

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
      console.log('Received hotel data update from extension:', event.data.hotels);
      currentHotels = event.data.hotels;
      renderLibrary(currentHotels);
      updateEmptyStates();
      showMessage('Hotel library updated!', 'green');
    }
  });

  // Also listen for chrome runtime messages (if available)
  if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'hotelDataUpdated' && message.hotels) {
        console.log('Received hotel data update from extension via chrome.runtime:', message.hotels);
        currentHotels = message.hotels;
        renderLibrary(currentHotels);
        updateEmptyStates();
        showMessage('Hotel library updated!', 'green');
        sendResponse({ received: true });
      }
    });
  }
}

function initExtensionIntegration() {
  console.log('Initializing extension integration...');

  const librarySection = document.getElementById('library');
  if (!librarySection) {
    console.warn('Library section not found');
    return;
  }

  const libraryGrid = librarySection.querySelector('.library-grid');
  if (!libraryGrid) {
    console.warn('Library grid not found');
    return;
  }

  console.log('Library section and grid found');

  // Create connection UI
  createConnectionUI(librarySection);
  console.log('Connection UI created');

  // If we have an ID, try to fetch data
  if (currentExtensionId) {
    console.log('Extension ID found in storage:', currentExtensionId);
    showMessage('Connecting to extension...', '#009A8E');
    fetchDataFromExtension(currentExtensionId);
  } else {
    console.log('No extension ID stored, attempting auto-detection');
    // Show empty state if no extension connected
    renderLibrary([]);
    updateEmptyStates();
    // Try to auto-detect extension ID by attempting connection
    autoDetectExtension();
  }
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
  console.log(`[WEBSITE] Attempting to fetch data from extension: ${extensionId}`);
  console.log('[WEBSITE] Window origin:', window.location.origin);

  // Set up a listener for the response
  const responseHandler = function (event) {
    console.log('[WEBSITE] Received message in responseHandler:', event.data);
    console.log('[WEBSITE] Message origin:', event.origin);
    console.log('[WEBSITE] Window origin:', window.location.origin);

    if (event.origin !== window.location.origin) {
      console.log('[WEBSITE] Ignoring message from different origin');
      return;
    }

    if (event.data && event.data.action === 'getStoredHotelsResponse') {
      console.log('[WEBSITE] Received hotels response:', event.data);
      window.removeEventListener('message', responseHandler);

      // Hide the connection UI box
      const extensionControls = document.querySelector('.extension-controls');
      if (extensionControls) {
        extensionControls.style.display = 'none';
      }

      // Update the library description to show extension status
      const libraryDescription = document.getElementById('library-description');

      if (event.data.success && event.data.hotels) {
        currentHotels = event.data.hotels;
        const hotelCount = event.data.hotels.length;
        const hotelText = hotelCount !== 1 ? 'hotels' : 'hotel';

        // Update description to show active status with bold green checkmark
        if (libraryDescription) {
          libraryDescription.innerHTML = `Extension active <span style="color: #10b981; font-weight: bold;">✓</span> Successfully synced ${hotelCount} ${hotelText}`;
        }

        showMessage(`Successfully synced ${hotelCount} ${hotelText}!`, 'green');
        renderLibrary(currentHotels);
        updateEmptyStates();
      } else {
        currentHotels = [];

        // Update description for connected but no hotels case
        if (libraryDescription) {
          libraryDescription.innerHTML = 'Extension active <span style="color: #10b981; font-weight: bold;">✓</span> Successfully synced 0 hotels';
        }

        showMessage('Connected! No hotels analyzed yet.', '#009A8E');
        renderLibrary([]);
        updateEmptyStates();
      }
    }
  };

  console.log('[WEBSITE] Adding message listener for response');
  window.addEventListener('message', responseHandler);

  // Set a timeout in case the extension doesn't respond
  setTimeout(() => {
    console.log('[WEBSITE] Timeout reached, removing listener');
    window.removeEventListener('message', responseHandler);
  }, 5000);

  // Send the request via postMessage to the content script
  console.log('[WEBSITE] Sending getStoredHotels request via postMessage');
  console.log('[WEBSITE] Message payload:', { action: 'getStoredHotels' });
  window.postMessage({ action: 'getStoredHotels' }, '*');
  console.log('[WEBSITE] Message sent');
}

function getFilteredAndSortedHotels() {
  let filtered = [...currentHotels];

  // 1. Filter by Search
  if (currentFilters.search) {
    const term = currentFilters.search.toLowerCase();
    filtered = filtered.filter(h => h.hotelName.toLowerCase().includes(term));
  }

  // 2. Filter by Destination
  if (currentFilters.destination !== 'all') {
    filtered = filtered.filter(h => {
      const loc = h.location || 'Unknown';
      return loc === currentFilters.destination;
    });
  }



  // 4. Filter by Price Range
  if (currentFilters.priceRange !== 'all') {
    filtered = filtered.filter(h => {
      const price = h.priceData ? h.priceData.pricePerNight : null;
      if (!price) return false;
      if (currentFilters.priceRange === 'low') return price < 150;
      if (currentFilters.priceRange === 'med') return price >= 150 && price <= 300;
      if (currentFilters.priceRange === 'high') return price > 300;
      return true;
    });
  }

  // 5. Sort
  filtered.sort((a, b) => {
    switch (currentFilters.sortBy) {
      case 'date-newest':
        return new Date(b.analyzedAt) - new Date(a.analyzedAt);
      case 'date-oldest':
        return new Date(a.analyzedAt) - new Date(b.analyzedAt);
      case 'rating-high':
        return b.analysis.adjustedRating - a.analysis.adjustedRating;
      case 'rating-low':
        return a.analysis.adjustedRating - b.analysis.adjustedRating;

      case 'price-low':
        return (a.priceData?.pricePerNight || 999999) - (b.priceData?.pricePerNight || 999999);
      case 'price-high':
        return (b.priceData?.pricePerNight || 0) - (a.priceData?.pricePerNight || 0);
      default:
        return 0;
    }
  });

  return filtered;
}

function renderFilterControls() {
  const librarySection = document.getElementById('library');
  if (!librarySection) return;
  const container = librarySection.querySelector('.container');

  // Check if already exists
  let filterBar = document.getElementById('library-filter-bar');
  if (!filterBar) {
    filterBar = document.createElement('div');
    filterBar.id = 'library-filter-bar';
    filterBar.style.cssText = 'margin-bottom: 20px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;';

    // Insert before library grid (and selection controls if present)
    const selControls = document.getElementById('selection-controls');
    const grid = container.querySelector('.library-grid');

    if (selControls) {
      container.insertBefore(filterBar, selControls);
    } else {
      container.insertBefore(filterBar, grid);
    }
  }

  // Calculate unique destinations (refresh options)
  const destinations = [...new Set(currentHotels.map(h => h.location || 'Unknown'))].filter(d => d).sort();
  const destOptions = destinations.map(d => `<option value="${d}" ${currentFilters.destination === d ? 'selected' : ''}>${d}</option>`).join('');

  filterBar.innerHTML = `
    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
      <!-- Search -->
      <div style="flex: 1; min-width: 250px;">
        <input type="text" id="filter-search" placeholder="Search hotels..." value="${currentFilters.search}" 
          style="width: 100%; padding: 10px 15px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;">
      </div>
      
      <!-- Sort -->
      <div style="min-width: 200px;">
        <select id="filter-sort" style="width: 100%; padding: 10px 15px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 14px; background: white; cursor: pointer;">
          <option value="date-newest" ${currentFilters.sortBy === 'date-newest' ? 'selected' : ''}>📅 Analyzed (Newest)</option>
          <option value="date-oldest" ${currentFilters.sortBy === 'date-oldest' ? 'selected' : ''}>📅 Analyzed (Oldest)</option>
          <option value="rating-high" ${currentFilters.sortBy === 'rating-high' ? 'selected' : ''}>⭐ Adjusted Rating (High)</option>

          <option value="price-low" ${currentFilters.sortBy === 'price-low' ? 'selected' : ''}>💰 Price (Low to High)</option>
          <option value="price-high" ${currentFilters.sortBy === 'price-high' ? 'selected' : ''}>💰 Price (High to Low)</option>
        </select>
      </div>
    </div>

    <div style="display: flex; gap: 10px; flex-wrap: wrap; border-top: 1px solid #edf2f7; padding-top: 15px;">
      <!-- Filters -->
      <select id="filter-dest" style="padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; background: white; cursor: pointer; min-width: 140px;">
        <option value="all">📍 All Destinations</option>
        ${destOptions}
      </select>



      <select id="filter-price" style="padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; background: white; cursor: pointer;">
        <option value="all" ${currentFilters.priceRange === 'all' ? 'selected' : ''}>💰 All Prices</option>
        <option value="low" ${currentFilters.priceRange === 'low' ? 'selected' : ''}>Budget (<$150)</option>
        <option value="med" ${currentFilters.priceRange === 'med' ? 'selected' : ''}>Mid-Range ($150-$300)</option>
        <option value="high" ${currentFilters.priceRange === 'high' ? 'selected' : ''}>Luxury (>$300)</option>
      </select>
      
      <div style="flex: 1;"></div>
      <button id="reset-filters" style="padding: 8px 16px; background: transparent; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; color: #718096; cursor: pointer; transition: all 0.2s;">
        Reset
      </button>
    </div>
  `;

  attachFilterListeners();
}

function attachFilterListeners() {
  const searchInput = document.getElementById('filter-search');
  const sortSelect = document.getElementById('filter-sort');
  const destSelect = document.getElementById('filter-dest');

  const priceSelect = document.getElementById('filter-price');
  const resetBtn = document.getElementById('reset-filters');

  if (searchInput) searchInput.oninput = (e) => { currentFilters.search = e.target.value; updateLibraryView(); };
  if (sortSelect) sortSelect.onchange = (e) => { currentFilters.sortBy = e.target.value; updateLibraryView(); };
  if (destSelect) destSelect.onchange = (e) => { currentFilters.destination = e.target.value; updateLibraryView(); };

  if (priceSelect) priceSelect.onchange = (e) => { currentFilters.priceRange = e.target.value; updateLibraryView(); };

  if (resetBtn) resetBtn.onclick = () => {
    currentFilters = { search: '', destination: 'all', priceRange: 'all', sortBy: 'date-newest' };

    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'date-newest';
    if (destSelect) destSelect.value = 'all';

    if (priceSelect) priceSelect.value = 'all';

    updateLibraryView();
  };
}

function updateLibraryView() {
  const filteredHotels = getFilteredAndSortedHotels();
  renderLibraryGrid(filteredHotels);

  // Update selection count text if needed
  updateSelectionState();
}

function renderLibrary(hotels) {
  const grid = document.querySelector('.library-grid');
  if (!grid) return;

  // If the TOTAL list is empty, show the "Get Started" empty state
  if (currentHotels.length === 0) {
    // Hide controls
    const selectionControls = document.getElementById('selection-controls');
    const filterBar = document.getElementById('library-filter-bar');
    if (selectionControls) selectionControls.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';

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

  // If we have hotels, show controls and render the current view
  renderFilterControls();
  renderSelectionControls();
  updateLibraryView();
}

function renderLibraryGrid(hotels) {
  const grid = document.querySelector('.library-grid');
  if (!grid) return;

  // If filtered list is empty (but total list is not), show "No matches"
  if (hotels.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #718096;">
        <div style="font-size: 40px; margin-bottom: 15px;">🔍</div>
        <h3 style="font-size: 18px; margin-bottom: 10px; color: #2d3748;">No hotels match your filters</h3>
        <p style="margin-bottom: 20px;">Try adjusting your search or filters to see more results.</p>
        <button id="clear-filters-btn" style="padding: 8px 16px; background: white; border: 1px solid #cbd5e0; border-radius: 6px; font-weight: 500; cursor: pointer; color: #4a5568; transition: all 0.2s;">
          Clear All Filters
        </button>
      </div>
    `;

    // Attach listener to the clear button inside grid
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) resetBtn.click();
      };
    }
    return;
  }

  grid.innerHTML = hotels.map(hotel => {
    try {
      if (!hotel || !hotel.analysis) {
        console.error('Invalid hotel data:', hotel);
        return '';
      }

      // Safe access to ratings
      const adjustedRating = hotel.analysis.adjustedRating || 0;
      const originalRating = hotel.originalRating || 0;

      // Calculate deviation status
      const diff = adjustedRating - originalRating;
      let deviationText = 'Accurate rating';
      let devColor = '#718096';

      if (diff < -1.0) { deviationText = 'Major rating inflation detected'; devColor = '#e53e3e'; }
      else if (diff < -0.5) { deviationText = 'Minor rating inflation detected'; devColor = '#dd6b20'; }
      else if (diff > 0.5) { deviationText = 'Better than rated'; devColor = '#38a169'; }

      // Clean hotel name
      const cleanName = cleanHotelName(hotel.hotelName || 'Unknown Hotel');

      // Use hotel image if available, otherwise use placeholder
      const imageHTML = hotel.imageUrl
        ? `<img src="${hotel.imageUrl}" alt="${cleanName}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<span style="font-size: 40px;">🏨</span>`;

      // Format analyzed date
      const analyzedDate = hotel.analyzedAt ? new Date(hotel.analyzedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'Unknown';

      // Format price information
      const priceInfo = hotel.priceData
        ? `${hotel.priceData.currency} ${hotel.priceData.pricePerNight.toLocaleString()}`
        : 'Price N/A';



      // Generate Key Insight (One-line summary)
      let insightText = '';
      const strengths = hotel.analysis.keyStrengths;
      const issues = hotel.analysis.keyIssues;

      if (Array.isArray(strengths) && strengths.length > 0 && Array.isArray(issues) && issues.length > 0) {
        insightText = `${strengths[0].strength}, but ${issues[0].issue}`;
      } else if (Array.isArray(strengths) && strengths.length > 0) {
        insightText = strengths[0].strength;
      } else if (Array.isArray(issues) && issues.length > 0) {
        insightText = issues[0].issue;
      } else {
        insightText = hotel.analysis.trends || hotel.analysis.commonComplaints || 'No specific insights available';
      }

      // Append short trend if available
      if (hotel.analysis.trends) {
        const lowerTrend = typeof hotel.analysis.trends === 'string' ? hotel.analysis.trends.toLowerCase() : '';
        let trendShort = '';

        if (lowerTrend.includes('declin') || lowerTrend.includes('worse') || lowerTrend.includes('deterior') || lowerTrend.includes('drop')) {
          trendShort = 'Trending down.';
        } else if (lowerTrend.includes('improv') || lowerTrend.includes('better') || lowerTrend.includes('upgrad') || lowerTrend.includes('renovat')) {
          trendShort = 'Improving.';
        }

        if (trendShort) {
          if (insightText && !insightText.endsWith('.')) insightText += '.';
          insightText += ` ${trendShort}`;
        }
      }

      return `
      <article class="hotel-card" data-hotel-id="${hotel.hotelId}">
        <div class="hotel-image" style="background-color: #e2e8f0; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          ${imageHTML}
          <div style="position: absolute; top: 10px; left: 10px;">
            <input type="checkbox" class="hotel-checkbox" data-hotel-id="${hotel.hotelId}" style="width: 20px; height: 20px; cursor: pointer;">
          </div>
        </div>
        <div class="hotel-content">
          <h3 style="margin-bottom: 8px; font-size: 18px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cleanName}">${cleanName}</h3>
          
          <div style="font-size: 13px; color: #718096; margin-bottom: 4px;">
            <span style="margin-right: 4px;">📍</span>${hotel.location || 'Unknown Location'}
          </div>
          
          <div style="font-size: 12px; color: #a0aec0; margin-bottom: 12px;">
            Analyzed: ${analyzedDate}
          </div>

          <!-- Rating Comparison -->
          <div class="rr-rating-section">
            <div class="rr-rating-comparison">
            <div class="rr-rating-item">
              <div class="rr-rating-label">Listed Rating</div>
              <div class="rr-rating-value rr-original">${Number(originalRating).toFixed(1)}</div>
            </div>
            <div class="rr-rating-arrow ${getRatingStatus(diff)}">
              ${getRatingArrow(diff)}
            </div>
            <div class="rr-rating-item">
              <div class="rr-rating-label">Adjusted Rating</div>
              <div class="rr-rating-value rr-adjusted">${adjustedRating.toFixed(1)}</div>
            </div>
          </div>
          <div class="rr-rating-status ${getRatingStatus(diff)}">
            ${getRatingStatusText(diff)}
          </div>
            ${hotel.reviewCount ? `<div style="font-size: 10px; color: #a0aec0; margin-top: 6px; text-align: center;">Based on ${hotel.reviewCount} reviews</div>` : ''}
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: #f7fafc; padding: 8px; border-radius: 4px;">
              <div style="font-size: 11px; color: #718096; margin-bottom: 2px;">Price/Night</div>
              <div style="font-size: 14px; font-weight: 600;">${priceInfo}</div>
            </div>
          </div>

          <div style="margin-bottom: 12px; background: #f8fafc; padding: 8px 10px; border-radius: 4px; font-size: 12px; line-height: 1.4; color: #4a5568; display: flex; align-items: start; gap: 6px; border: 1px solid #e2e8f0;">
            <span style="font-size: 14px;">💡</span>
            <span style="font-weight: 500;">${insightText}</span>
          </div>

          <a href="${hotel.url || '#'}" target="_blank" style="display: block; text-align: center; font-size: 14px; font-weight: 600; color: #009A8E; text-decoration: none; border: 1px solid #009A8E; padding: 8px; border-radius: 4px; transition: all 0.2s;">
            View on ${getOTAName(hotel.url || '')}
          </a>
        </div>
      </article>
      `;
    } catch (e) {
      console.error('Error rendering hotel card:', e, hotel);
      return '';
    }
  }).join('');

  // Add event listeners to checkboxes
  attachCheckboxListeners();
}

// Helpers for renderLibraryGrid
function getRatingStatus(diff) {
  if (diff < -0.5) return 'lower';
  if (diff > 0.5) return 'higher';
  return 'accurate';
}

function getRatingArrow(diff) {
  const status = getRatingStatus(diff);
  return status === 'lower' ? '↓' : status === 'higher' ? '↑' : '→';
}

function getRatingStatusText(diff) {
  const status = getRatingStatus(diff);
  return status === 'lower' ? '⚠️ Lower than advertised' :
    status === 'higher' ? '✨ Better than expected' :
      '✓ Rating is accurate';
}

function renderSelectionControls() {
  // Check if controls already exist
  let controlsDiv = document.getElementById('selection-controls');

  if (!controlsDiv) {
    // Create controls div
    controlsDiv = document.createElement('div');
    controlsDiv.id = 'selection-controls';
    controlsDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;';

    controlsDiv.innerHTML = `
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
        <input type="checkbox" id="select-all-checkbox" style="width: 18px; height: 18px; cursor: pointer;">
        <span>Select All</span>
      </label>
      <div style="flex: 1;"></div>
      <span id="selected-count" style="color: #4a5568; font-size: 14px;">0 selected</span>
      <button id="compare-selected-btn" style="padding: 8px 16px; background: #009A8E; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; opacity: 0.5; pointer-events: none;" disabled>
        Compare Selected
      </button>
      <button id="delete-selected-btn" style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; opacity: 0.5; pointer-events: none;" disabled>
        Delete Selected
      </button>
    `;

    // Insert before the library grid
    const librarySection = document.getElementById('library');
    const container = librarySection.querySelector('.container');
    const grid = container.querySelector('.library-grid');
    container.insertBefore(controlsDiv, grid);
  }

  // Show the controls
  controlsDiv.style.display = 'flex';

  // Attach event listeners
  attachControlListeners();
}

function attachCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.hotel-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectionState);
  });
}

function attachControlListeners() {
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const compareBtn = document.getElementById('compare-selected-btn');
  const deleteBtn = document.getElementById('delete-selected-btn');

  if (selectAllCheckbox) {
    selectAllCheckbox.removeEventListener('change', toggleSelectAll);
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
  }

  if (compareBtn) {
    compareBtn.removeEventListener('click', compareSelected);
    compareBtn.addEventListener('click', compareSelected);
  }

  if (deleteBtn) {
    deleteBtn.removeEventListener('click', deleteSelected);
    deleteBtn.addEventListener('click', deleteSelected);
  }
}

function toggleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.hotel-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
  });
  updateSelectionState();
}

function updateSelectionState() {
  const checkboxes = document.querySelectorAll('.hotel-checkbox');
  const checkedBoxes = document.querySelectorAll('.hotel-checkbox:checked');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const selectedCount = document.getElementById('selected-count');
  const compareBtn = document.getElementById('compare-selected-btn');
  const deleteBtn = document.getElementById('delete-selected-btn');

  // Update select all checkbox state
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
    selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
  }

  // Update count
  if (selectedCount) {
    selectedCount.textContent = `${checkedBoxes.length} selected`;
  }

  // Update button states
  const hasSelection = checkedBoxes.length > 0;
  const canCompare = checkedBoxes.length >= 2 && checkedBoxes.length <= 3;

  if (compareBtn) {
    compareBtn.disabled = !canCompare;
    compareBtn.style.opacity = canCompare ? '1' : '0.5';
    compareBtn.style.pointerEvents = canCompare ? 'auto' : 'none';
  }

  if (deleteBtn) {
    deleteBtn.disabled = !hasSelection;
    deleteBtn.style.opacity = hasSelection ? '1' : '0.5';
    deleteBtn.style.pointerEvents = hasSelection ? 'auto' : 'none';
  }
}

function compareSelected() {
  const checkedBoxes = document.querySelectorAll('.hotel-checkbox:checked');
  if (checkedBoxes.length < 2 || checkedBoxes.length > 3) {
    alert('Please select 2-3 hotels to compare');
    return;
  }

  const hotelIds = Array.from(checkedBoxes).map(cb => cb.dataset.hotelId);
  const hotels = hotelIds.map(id => currentHotels.find(h => h.hotelId === id)).filter(h => h);

  // Clear all slots first
  clearCompareSlot('compare-slot-1');
  clearCompareSlot('compare-slot-2');
  clearCompareSlot('compare-slot-3');

  // Populate slots with selected hotels
  if (hotels.length >= 1) populateCompareSlot('compare-slot-1', hotels[0]);
  if (hotels.length >= 2) populateCompareSlot('compare-slot-2', hotels[1]);
  if (hotels.length >= 3) populateCompareSlot('compare-slot-3', hotels[2]);

  // Scroll to comparison section
  document.getElementById('compare').scrollIntoView({ behavior: 'smooth' });

  // Render recommendation based on selected hotels
  renderRecommendation(hotels);
}

function deleteSelected() {
  const checkedBoxes = document.querySelectorAll('.hotel-checkbox:checked');
  if (checkedBoxes.length === 0) return;

  const count = checkedBoxes.length;
  const confirmMsg = `Are you sure you want to delete ${count} hotel${count > 1 ? 's' : ''}?`;

  if (!confirm(confirmMsg)) return;

  const hotelIdsToDelete = Array.from(checkedBoxes).map(cb => cb.dataset.hotelId);

  // Remove from currentHotels array
  currentHotels = currentHotels.filter(h => !hotelIdsToDelete.includes(h.hotelId));

  // Send message to extension to update storage
  window.postMessage({
    action: 'deleteHotels',
    hotelIds: hotelIdsToDelete
  }, '*');

  // Re-render library
  renderLibrary(currentHotels);
  updateEmptyStates();

  // Re-run recommendation with remaining hotels
  // If a deleted hotel was being compared, it will be excluded from recommendation
  const currentHotelsInComparison = getCurrentComparedHotels();
  renderRecommendation(currentHotelsInComparison);

  showMessage(`Deleted ${count} hotel${count > 1 ? 's' : ''}`, '#e53e3e');
}

function populateCompareSlot(slotId, hotel) {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  const cleanName = cleanHotelName(hotel.hotelName);

  // Extract top issues and strengths
  const topIssues = hotel.analysis.keyIssues ? hotel.analysis.keyIssues.slice(0, 3) : [];
  const topStrengths = hotel.analysis.keyStrengths ? hotel.analysis.keyStrengths.slice(0, 3) : [];

  // Format Price
  const priceInfo = hotel.priceData
    ? `<div class="price-value">${hotel.priceData.currency} ${hotel.priceData.pricePerNight.toLocaleString()}</div><div class="price-sub">/night</div>`
    : '<div class="price-value">N/A</div>';



  // Trends Logic
  const trendText = hotel.analysis.trends || 'No distinct trend data available';
  let trendStatus = 'Stable';
  let trendIcon = '➡️';
  let trendClass = 'trend-stable';

  const lowerTrend = trendText.toLowerCase();
  if (lowerTrend.includes('declin') || lowerTrend.includes('worse') || lowerTrend.includes('deterior') || lowerTrend.includes('drop')) {
    trendStatus = 'Declining';
    trendIcon = '↘️';
    trendClass = 'trend-declining';
  } else if (lowerTrend.includes('improv') || lowerTrend.includes('better') || lowerTrend.includes('upgrad') || lowerTrend.includes('renovat')) {
    trendStatus = 'Improving';
    trendIcon = '↗️';
    trendClass = 'trend-improving';
  }

  // Image
  const imageHTML = hotel.imageUrl
    ? `<img src="${hotel.imageUrl}" alt="${cleanName}" class="compare-card-image">`
    : `<div class="compare-card-image-placeholder">🏨</div>`;

  slot.innerHTML = `
    <div class="compare-card-inner">
      <div class="compare-header">
        ${imageHTML}
        <div class="compare-title-row">
          <h3 title="${cleanName}">${cleanName}</h3>
          <button onclick="clearCompareSlot('${slotId}')" class="compare-remove-btn" title="Remove">×</button>
        </div>
      </div>

      <div class="compare-metrics">
        <div class="compare-metric-row">
          <div class="metric-label">Rating</div>
          <div class="metric-values rating-comparison">
             <span class="listed-rating" title="Listed">${Number(hotel.originalRating).toFixed(1)}</span>
             <span class="rating-arrow">→</span>
             <div style="display: flex; flex-direction: column; align-items: center;">
               <span class="adjusted-rating" style="background-color: ${getRatingColorBox(hotel.analysis.adjustedRating)};" title="Adjusted">${hotel.analysis.adjustedRating.toFixed(1)}</span>
               ${hotel.reviewCount ? `<span style="font-size: 9px; color: #a0aec0; margin-top: 2px; line-height: 1;">(${hotel.reviewCount})</span>` : ''}
             </div>
          </div>
        </div>

        <div class="compare-metric-row">
          <div class="metric-label">Price</div>
          <div class="metric-values">${priceInfo}</div>
        </div>



        <div class="compare-metric-row">
          <div class="metric-label">Trend</div>
          <div class="metric-values">
            <div class="trend-badge ${trendClass}" title="${trendText}">
              ${trendIcon} ${trendStatus}
            </div>
          </div>
        </div>
      </div>

      <div class="compare-features">
        <div class="feature-block strengths">
          <h4>Top Strengths</h4>
          ${topStrengths.length > 0 ? `
            <ul>
              ${topStrengths.map(s => `<li>${s.strength || s}</li>`).join('')}
            </ul>
          ` : '<p class="no-data">None detected</p>'}
        </div>

        <div class="feature-block issues">
          <h4>Top Issues</h4>
          ${topIssues.length > 0 ? `
            <ul>
              ${topIssues.map(i => `<li>${i.issue || i}</li>`).join('')}
            </ul>
          ` : '<p class="no-data">None detected</p>'}
        </div>
      </div>

      <a href="${hotel.url}" target="_blank" class="compare-cta">
        View on ${getOTAName(hotel.url)}
      </a>
    </div>
  `;

  slot.className = 'compare-filled';
  slot.dataset.hotelId = hotel.hotelId;
}

function getRatingColorBox(rating) {
  if (rating >= 8) return '#009A8E';
  if (rating >= 6) return '#dd6b20';
  return '#e53e3e';
}

function renderRecommendation(hotels) {
  const container = document.getElementById('recommendation-container');
  if (!container) return;

  // Clear if not enough hotels
  if (!hotels || hotels.length < 2) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  // Calculate scores and find winner
  // Logic: Score = AdjustedRating + (ValueScore * 0.5)
  // Max score ≈ 10 + 5 = 15
  const rankedHotels = hotels.map(hotel => {
    const rating = hotel.analysis.adjustedRating || 0;
    const score = rating;
    return { ...hotel, score };
  }).sort((a, b) => b.score - a.score);

  const winner = rankedHotels[0];
  const cleanName = cleanHotelName(winner.hotelName);

  container.style.display = 'block';
  container.innerHTML = `
    <div style="background: #f0fdfa; border: 1px solid #ccfbf1; color: #2d3748; padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: -10px; right: -10px; font-size: 100px; opacity: 0.05;">🏆</div>
      
      <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1;">
          <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 5px; color: #009A8E;">Unmask Recommends</div>
          <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 5px; color: #1a202c;">${cleanName}</h3>
            Based on our analysis, this hotel offers the highest adjusted quality rating among your selection.
          </p>
        </div>
        
        <div style="display: flex; gap: 15px;">
          <div style="background: white; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #718096;">Adjusted Quality</div>
            <div style="font-size: 20px; font-weight: 700; color: #2d3748;">${winner.analysis.adjustedRating.toFixed(1)}</div>
          </div>

        </div>
        
        <a href="${winner.url}" target="_blank" style="background: #009A8E; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 4px rgba(0,154,142,0.2); transition: transform 0.2s;">
          Book Now ↗
        </a>
      </div>
    </div>
  `;
}

function getCurrentComparedHotels() {
  const slots = ['compare-slot-1', 'compare-slot-2', 'compare-slot-3'];
  const hotels = [];

  slots.forEach(slotId => {
    const slot = document.getElementById(slotId);
    if (!slot || !slot.classList.contains('compare-filled')) return;

    // Reverse engineer ID from title or find in currentHotels based on rendered name
    // Easier: store hotel ID in dataset when populating
    const titleEl = slot.querySelector('h3');
    if (titleEl) {
      // Find hotel by matching name in currentHotels (not perfect but works for now)
      // Better: Update populateCompareSlot to store ID
      // Let's implement getting ID from dataset which we'll add
      const hotelId = slot.dataset.hotelId;
      if (hotelId) {
        const hotel = currentHotels.find(h => h.hotelId === hotelId);
        if (hotel) hotels.push(hotel);
      }
    }
  });
  return hotels;
}

function clearCompareSlot(slotId) {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  const slotNumber = slotId === 'compare-slot-1' ? '1' : slotId === 'compare-slot-2' ? '2' : '3';
  slot.className = 'compare-placeholder';
  slot.dataset.hotelId = ''; // Clear hotel ID
  slot.innerHTML = `
    <h3>Hotel ${slotNumber}</h3>
    <p>Select a hotel to compare</p>
  `;

  // Re-run recommendation with remaining hotels
  const currentHotelsInComparison = getCurrentComparedHotels();
  renderRecommendation(currentHotelsInComparison);
}

function cleanHotelName(rawName) {
  // Remove common booking.com prefixes/suffixes
  let cleaned = rawName;

  // Remove "tilbud på" (Norwegian) or "offers on" (English) prefix
  cleaned = cleaned.replace(/^(tilbud på|offers on)\s+/i, '');

  // Remove "Deals" or "Tilbud" suffix
  cleaned = cleaned.replace(/\s+(deals|tilbud)\s*$/i, '');

  // Remove everything in parentheses (like "(Resort) (Thailand)" or "(Ferieanlegg)")
  // This handles multiple parentheses at the end
  cleaned = cleaned.replace(/(\s*\([^)]*\))+\s*$/g, '');

  // Remove trailing content after common separators
  cleaned = cleaned.split(' - ')[0];
  cleaned = cleaned.split(',')[0];

  return cleaned.trim();
}

function getOTAName(url) {
  if (url.includes('booking.com')) return 'Booking.com';
  if (url.includes('hotels.com')) return 'Hotels.com';
  if (url.includes('expedia')) return 'Expedia';
  return 'Booking Site';
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
