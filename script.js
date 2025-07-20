// Generate Routine button logic
const generateBtn = document.getElementById("generateRoutine");
if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    if (!selectedProducts.length) {
      appendMessage(
        "Please select at least one product to generate a routine.",
        "ai"
      );
      return;
    }
    // Create a plain English list of selected products
    const productList = selectedProducts
      .map((p) => `${p.name} (${p.brand}, ${p.category || ""})`)
      .join(", ");
    // Add a message to the conversation for context
    conversation.push({
      role: "user",
      content: `Here are the products I have: ${productList}. Please tell me when to use each product in my routine.`,
    });
    // Show user message in chat window (like a normal user message)
    appendMessage(
      "Can you create a skincare or beauty routine using my selected products?",
      "user"
    );
    // Call AI and display the routine in the chat window
    await getAIResponse();
  });
}
// --- Product Grid & Selection Logic ---
// Get DOM elements
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedList = document.getElementById("selectedProductsList");

// Store selected products in an array
let selectedProducts = [];
const SELECTED_PRODUCTS_KEY = "loreal_selected_products";

// Load selected products from localStorage if available
const savedProducts = localStorage.getItem(SELECTED_PRODUCTS_KEY);
if (savedProducts) {
  try {
    selectedProducts = JSON.parse(savedProducts);
  } catch (e) {
    selectedProducts = [];
  }
}

// Function to load products from products.json
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

// Function to display products in the grid
function displayProducts(products) {
  if (!productsContainer) return;
  if (!products.length) {
    productsContainer.innerHTML =
      '<div class="placeholder-message">No products found for this category.</div>';
    return;
  }
  productsContainer.innerHTML = products
    .map((product, idx) => {
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
      <div class="product-card${
        isSelected ? " selected" : ""
      }" data-product-idx="${idx}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <button class="view-description-btn" data-desc-idx="${idx}" tabindex="0">View Description</button>
      </div>
    `;
    })
    .join("");

  // Add click listeners to product cards (for selection)
  document.querySelectorAll(".product-card").forEach((card, idx) => {
    card.addEventListener("click", (e) => {
      // Only select if not clicking the description button
      if (e.target.classList.contains("view-description-btn")) return;
      const product = products[idx];
      const alreadySelected = selectedProducts.some(
        (p) => p.name === product.name
      );
      if (!alreadySelected) {
        selectedProducts.push(product);
        localStorage.setItem(
          SELECTED_PRODUCTS_KEY,
          JSON.stringify(selectedProducts)
        );
        renderSelectedProducts();
        displayProducts(products); // update highlight
      }
    });
  });

  // Add click listeners to View Description buttons
  document.querySelectorAll(".view-description-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = btn.getAttribute("data-desc-idx");
      showDescriptionModal(products[idx]);
    });
    // Keyboard accessibility
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const idx = btn.getAttribute("data-desc-idx");
        showDescriptionModal(products[idx]);
      }
    });
  });
}

// Modal for product description
function showDescriptionModal(product) {
  let modal = document.getElementById("descriptionModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "descriptionModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button class="modal-close-btn" aria-label="Close description">&times;</button>
        <h2 id="modalTitle"></h2>
        <p class="modal-desc"></p>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Set content
  modal.querySelector("#modalTitle").textContent = product.name;
  modal.querySelector(".modal-desc").textContent =
    product.description || "No description available.";
  modal.style.display = "flex";
  // Focus for accessibility
  modal.querySelector(".modal-close-btn").focus();

  // Close modal on close button click
  modal.querySelector(".modal-close-btn").onclick = () => {
    modal.style.display = "none";
  };
  // Close modal on overlay click (but not content click)
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
  // Close modal on Escape key
  document.onkeydown = function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
    }
  };
}

// Function to render selected products area
function renderSelectedProducts() {
  if (!selectedList) return;
  if (!selectedProducts.length) {
    selectedList.innerHTML =
      '<div class="placeholder-message">No products selected yet.</div>';
    // Remove clear all button if present
    const clearBtn = document.getElementById("clearSelectedProductsBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }
  // Add Clear All button if not present
  let clearBtn = document.getElementById("clearSelectedProductsBtn");
  if (!clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedProductsBtn";
    clearBtn.className = "clear-selected-btn";
    clearBtn.textContent = "Clear All";
    // Insert at the top right of the selected products section
    const parent = selectedList.parentElement;
    clearBtn.style.position = "absolute";
    clearBtn.style.top = "18px";
    clearBtn.style.right = "18px";
    parent.style.position = "relative";
    parent.insertBefore(clearBtn, selectedList);
  }
  clearBtn.onclick = function () {
    selectedProducts = [];
    localStorage.removeItem(SELECTED_PRODUCTS_KEY);
    renderSelectedProducts();
  };

  selectedList.innerHTML = selectedProducts
    .map(
      (product, idx) => `
    <div class="product-card mini">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="remove-product-btn" data-remove-idx="${idx}" title="Remove">&times;</button>
    </div>
  `
    )
    .join("");

  // Add click listeners to remove buttons
  document.querySelectorAll(".remove-product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = btn.getAttribute("data-remove-idx");
      if (selectedProducts[idx]) {
        selectedProducts.splice(idx, 1);
        localStorage.setItem(
          SELECTED_PRODUCTS_KEY,
          JSON.stringify(selectedProducts)
        );
        renderSelectedProducts();
      }
    });
  });
}

// Listen for category changes
if (categoryFilter) {
  categoryFilter.addEventListener("change", async (e) => {
    const products = await loadProducts();
    const selectedCategory = e.target.value;
    const filteredProducts = products.filter(
      (product) => product.category === selectedCategory
    );
    displayProducts(filteredProducts);
  });
}

// Initial render for selected products
renderSelectedProducts();
// Add event listener for Generate Routine button (in selected products section)

// Add product to selected products and update UI
function addProductToSelected(product) {
  if (selectedProducts.some((p) => p.name === product.name)) return;
  selectedProducts.push(product);
  localStorage.setItem(SELECTED_PRODUCTS_KEY, JSON.stringify(selectedProducts));
  renderSelectedProducts();
}

// Filter and display products when category changes
if (categoryFilter) {
  categoryFilter.addEventListener("change", async (e) => {
    const products = await loadProducts();
    const selectedCategory = e.target.value;

    // filter() creates a new array containing only products where the category matches what the user selected
    const filteredProducts = products.filter(
      (product) => product.category === selectedCategory
    );

    window.lastDisplayedProducts = filteredProducts;
    displayProducts(filteredProducts);
  });
}

// Initial render for selected products
renderSelectedProducts();
/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const workerurl = "https://loreal-bot-worker.youssefm200322.workers.dev/"; //cloudflare worker URL

// Store conversation history
let conversation = [];

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// System prompt for the chatbot
const systemPrompt =
  "You are a helpful assistant for L'Oréal. If the user provides a list of products, always answer questions about routines or recommendations using those products, as they are L'Oréal products. Only refuse to answer if the question is not about L'Oréal, its products, or beauty routines. If unsure, assume the products provided are L'Oréal products and help the user create a routine or give advice using them.";

// Attach chat form submit handler after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Do NOT clear the chat window, just append

    // Add user message to conversation history
    conversation.push({ role: "user", content: message });
    appendMessage(message, "user");
    userInput.value = "";

    // Send the conversation to the Cloudflare worker
    getAIResponse();
  });
});

// Function to add a message to the chat window
function appendMessage(text, sender) {
  // Create a new div for the message
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", sender);
  if (text === "Thinking...") {
    // Animated thinking dots
    msgDiv.textContent = "Thinking";
    let dotCount = 0;
    const maxDots = 3;
    const interval = setInterval(() => {
      dotCount = (dotCount + 1) % (maxDots + 1);
      msgDiv.textContent = "Thinking" + ".".repeat(dotCount);
    }, 500);
    // Store interval id for later removal
    msgDiv.dataset.thinkingInterval = interval;
  } else {
    msgDiv.textContent = text;
  }
  chatWindow.appendChild(msgDiv);
  // Scroll to the bottom so new messages are visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to get AI response from the Cloudflare worker
async function getAIResponse(userMessage) {
  // Show a loading message while waiting for response
  appendMessage("Thinking...", "ai");

  try {
    // Build the full message history for the API
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation,
    ];

    // Prepare the request body for the worker
    const body = {
      messages: messages,
      model: "gpt-4o",
    };

    // Send the request to the Cloudflare worker
    const response = await fetch(workerurl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Parse the response as JSON
    const data = await response.json();

    // Remove the loading message and stop animation
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent.startsWith("Thinking")) {
      // Stop the animation interval
      if (loadingMsg.dataset.thinkingInterval) {
        clearInterval(loadingMsg.dataset.thinkingInterval);
      }
      chatWindow.removeChild(loadingMsg);
    }

    // Show the AI's reply in the chat window
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      appendMessage(data.choices[0].message.content, "ai");
      // Add AI message to conversation history
      conversation.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      appendMessage(
        "Sorry, I couldn't get a response. Please try again.",
        "ai"
      );
    }
  } catch (error) {
    // Remove the loading message and stop animation if there's an error
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent.startsWith("Thinking")) {
      if (loadingMsg.dataset.thinkingInterval) {
        clearInterval(loadingMsg.dataset.thinkingInterval);
      }
      chatWindow.removeChild(loadingMsg);
    }
    // Show error message
    appendMessage("Oops! Something went wrong. Please try again.", "ai");
  }
}
