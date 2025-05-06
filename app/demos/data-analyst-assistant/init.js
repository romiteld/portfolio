'use client';

/**
 * Data Analyst Assistant Component Initialization
 * This script ensures the component works correctly with the global scroll protection
 */

// Run this code on component mount to ensure all elements are properly marked
function initDataAnalystAssistant() {
  // Function to mark all elements within the data analyst component
  function markAllElements() {
    // Mark the main containers
    document.querySelectorAll('.data-analyst-container, [class*="data-analyst"]').forEach(el => {
      el.setAttribute('data-component-name', 'DataAnalystAssistant');
    });

    // Find and mark all buttons, inputs, and interactive elements in the component
    const selector = '.flex-grow > div, .flex-grow button, .flex-grow input, .flex-grow select';
    document.querySelectorAll(selector).forEach(el => {
      el.setAttribute('data-component-name', 'DataAnalystAssistant');
    });

    // Ensure parent containers are marked
    document.querySelectorAll('.bg-white.rounded-lg').forEach(el => {
      if (el.querySelector('input[type="file"]')) {
        el.setAttribute('data-component-name', 'DataAnalystAssistant');
        // Mark all children
        el.querySelectorAll('*').forEach(child => {
          child.setAttribute('data-component-name', 'DataAnalystAssistant');
        });
      }
    });
  }

  // Ensure all scroll restriction styles are removed for this component
  function removeScrollRestrictions() {
    // Clear any style attributes that might interfere
    document.querySelectorAll('[data-component-name="DataAnalystAssistant"]').forEach(el => {
      el.style.scrollBehavior = '';
      el.style.overflowAnchor = '';
    });

    // Make sure the document and body are free from restrictions
    document.documentElement.style.scrollBehavior = '';
    document.documentElement.style.overflowAnchor = '';
    document.body.style.overflowAnchor = '';
  }

  // Function to make sure click events work properly
  function fixEventHandling() {
    // Find all buttons within the component
    document.querySelectorAll('[data-component-name="DataAnalystAssistant"] button').forEach(button => {
      // Add a direct click handler to ensure clicks are processed
      button.addEventListener('click', (e) => {
        // Prevent any other handlers from stopping propagation
        e.stopPropagation = function() {}; 
        
        // Force the trigger of the built-in click handler
        const originalClick = button.onclick;
        if (originalClick) {
          originalClick.call(button, e);
        }
      }, true);
    });
  }

  // Run all fixes
  markAllElements();
  removeScrollRestrictions();
  fixEventHandling();

  // Set up a MutationObserver to keep applying fixes as the DOM changes
  const observer = new MutationObserver(() => {
    markAllElements();
    fixEventHandling();
  });

  // Watch for DOM changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Ensure file input works by adding a direct handler
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.onclick = (e) => {
      e.stopPropagation = function() {}; // Disable stopPropagation
    };
  }

  // Create a console log for debugging
  console.log('Data Analyst Assistant initialized and scroll protection disabled for this component');
}

// Execute when the module is loaded
export default initDataAnalystAssistant;
