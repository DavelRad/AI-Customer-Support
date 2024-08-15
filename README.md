# **AI-Powered Support Chatbot**

This project is an AI-driven support chatbot designed to enhance user experience on platforms like Headstarter, a platform facilitating AI-powered interviews for software engineering candidates. The chatbot dynamically selects the best AI model based on user queries, ensuring that responses are contextually relevant, accurate, and engaging.


## **Features**



* **Dynamic AI Model Selection**: The chatbot intelligently chooses the most appropriate AI model (e.g., `meta-llama/llama-3.1-8b-instruct`, `RWKV`, `MythoMist`) based on the content of the user's query, optimizing response accuracy and relevance.
* **Multi-Model Support**:
    * **LLama-3.1-8b-Instruct**: Handles general support and platform information.
    * **RWKV**: Ideal for technical questions, coding, and multi-lingual tasks.
    * **MythoMist**: Best for creative and storytelling tasks, role-playing scenarios.
* **File Upload Capability**: Users can upload documents (up to 40KB) that the chatbot can use to provide more informed responses.
* **Real-Time Streaming Responses**: The chatbot streams its responses to provide near-instant feedback, improving user experience.
* **Customizable UI**: The front-end is built with React.js and Material UI, providing a sleek, modern interface with a dark theme for comfortable usage.


## **Technology Stack**


### **Frontend**



* **React.js**: A JavaScript library for building user interfaces.
* **Next.js**: A React framework for server-side rendering and static site generation.
* **Material UI**: Provides pre-built components and styling, ensuring a consistent, modern look.


### **Backend**



* **Node.js**: Handles server-side logic and API requests.
* **Next.js API Routes**: Used for handling backend processes like file uploads and model selection.
* **Pinecone**: A vector database used to index and search embeddings.
* **Hugging Face Inference API**: Generates embeddings and powers the AI models.


## **Installation and Setup**



1. **Clone the repository**: 
`git clone https://github.com/your-username/ai-support-chatbot.git`
2. **Navigate to the project directory**: 
`cd ai-support-chatbot`
3. **Install dependencies**: 
`npm install`
4. **Set up environment variables**:
    * Create a `.env.local` file in the root directory.
    * Add your API keys: 
        ```
        PINECONE_API_KEY=your_pinecone_api_key
        HUGGINGFACE_API_KEY=your_huggingface_api_key
        OPENROUTER_API_KEY=your_openrouter_api_key
        ```


5. **Run the application**: 
        ```
        node script.mjs
        npm run dev
        ```
7. **Access the application**:
    * Open your browser and navigate to `http://localhost:3000`.


## **Usage**



* **Start a conversation**: Enter your message in the chat input field and press Enter or click "Send".
* **Upload a document**: Click on the "Add Docs" button, choose your file (up to 40KB), and upload it to provide additional context for the chatbot.
* **Model Information**: Each response from the chatbot indicates which AI model was used, giving you insight into how the system is operating.


## **Project Structure**



* **<code>page.js</code></strong>: Handles the frontend UI, including chat interactions, message formatting, and file uploads.
* <strong><code>route.js</code></strong>: Manages backend API routes, including file processing, AI model selection, and handling user messages.


## <strong>Contributing</strong>

Contributions are welcome! Feel free to fork this repository, make your changes, and submit a pull request.
