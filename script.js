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
  "You are a helpful assistant for L'Oréal. Only answer questions related to L'Oréal products, beauty routines, and recommendations. Always use the previous user questions and your own answers for context, so follow-up questions are answered in relation to the ongoing conversation. If asked about anything else, politely refuse and say: 'I'm sorry, I can only help with L'Oréal products, routines, and recommendations.' Do not answer questions outside these areas.";

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // Clear previous chat window 
  chatWindow.innerHTML = "";

  // Add user message to conversation history
  conversation.push({ role: "user", content: message });
  appendMessage(message, "user");
  userInput.value = "";

  // Send the conversation to the Cloudflare worker
  getAIResponse();
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
