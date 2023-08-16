
# DeepLearning.ai

## TLDR: Large Language Models with Semantic Search

### Foundation Models and Generative AI

Foundation Models (FMs) are extensive deep learning models pre-trained using attention mechanisms on vast datasets. They can be adapted for various tasks, including content generation.

Generative AI refers to methods that generate content using algorithms, often based on deep learning models such as Generative Adversarial Networks (GANs), Variational Auto-Encoders (VAEs), or Foundation Models (FMs).

**GAN**: Generational Adversarial Network
**VAE**: Variational Auto-Encoder

### LLM Architecture and Training

1. **Input Data**: Large-scale input datasets, often in the order of terabytes.
2. **Transformer Model**: Data is fed into a Transformer Model with a significant number of parameters.
3. **Training**: The model is trained on a specific task, e.g., predicting the next word in a sentence, for a considerable period.
4. **Foundation Model (FM)**: The trained model becomes a Foundation Model, capable of generalizing to various text-generation tasks. The model size can be substantial.

### Text Representations and Embeddings

- **Embeddings**: Numerical representations of text, crucial for various NLP tasks.
- **Weaviate Vector Database**: Used for managing and querying vector embeddings.
- **Pandas Library**: Utilized for handling tabular data.

To create an embedding, a model is required.
Embeddings can be visualized using tools like UMAP and Altair.

### Dense Retrieval and Vector Database

- **Dense Retrieval**: Finding items close to specific embeddings.
- **Vector Database**: A collection of embeddings for efficient retrieval.
- **Chunking**: Slicing text into segments for embedding conversion.
- **Appending Data**: Relevant information, like film titles, can be appended to sentences for context before generating embeddings.
- **Annoy Library**: Used for efficient vector searches. It is very basic compared to a full-fledged vector database.

### Re-Ranking and Evaluation

- **Re-Rank**: Reordering search results based on relevance, correcting mistakes made by the nearest semantic neighbors.
- Relevance/Re-Rank is trained on both correct and incorrect query-answer pairs.
- **Evaluation Metrics**: MAP (Mean Average Precision), MRR (Mean Reciprocal Rank), NDCG (Normalized Discounted Cumulative Gain).

### Contextual Search and LLMs

- Context Addition: Anchoring a query with specific context for more accurate answers.
- Adding a Search Model: Building context using a search model before utilizing a generative model for query processing.

### Costs

Using LLMs is expensive, both in terms of time and money. The costs can be reduced by using a smaller model, a smaller dataset, or a smaller number of training epochs.
Using an LLM service is also an option. Usually, the service is charged per tokens processed.
Tokens are often ~4 characters: https://platform.openai.com/tokenizer

---


## TLDR: LangChain for LLM Application Development

### ReAct: Chain-of-Thought Reasoning

ReAct is a reasoning framework based on the sequence of **Thought**, **Action**, and **Observation**. It aims to enhance understanding and decision-making processes.

By utilizing pre-existing LLMs, the initial search phase refines or constructs context to be incorporated into prompts, enabling more effective content generation and query processing.

### LangChai Parser

Use LangChai Parser to extract meaningful data from search model output.
JSON schema and prompt instructions enhance data extraction.
Parser supports object extraction from search results.


### LangChai Memory: Efficient Context Management

LangChai Memory addresses the statelessness of LLMs. Various memory types offer context retention:
- **ConversationBufferMemory**: Preserves complete conversation history.
- **ConversationBufferWindowMemory**: Stores recent N messages.
- **ConversationTokenBufferMemory**: Retains the last N tokens.
- **ConversationSummaryMemory**: Generates summaries with a System actor, compacting history.
- **Vector Data Memory**: Holds history in vectors, finding similarity to current text.
- **Entity Memory**: Recollects entity details.
Mix memory types for richer context handling, considering the trade-off between history length and processing costs.

### LangChai Chains: Streamlined Sequential Processing

LangChai Chains enable sequential LLM processing:
- **LLMChain**: Basic ring, uses LLM and prompt template.
- **SimpleSequentialChain**: Single input/output chain.
- **SequentialChain**: Multiple input/output chain.
- **Router Chain**: Selects LLM based on list or LLM's choice.
Chains simplify multi-step tasks, boosting efficiency and modularity.

Example of sequential chain:
- Translate a review
- Summarize the review
- What is the original language?
- Write an answer in the original language

### LangChai: Q&A with Documents

LLMs have few thousands word inspect limits, so use embeddings and vector databases to
overcome this limitation.

Chain types:

- **stuff**: Single LLM query per text block.
- **map_reduce**: Generate multiple queries per doc for an answer plus one additional query for the answer.
- **refine**: Use past answers to refine queries plus one additional query for the answer.
- **map_rerank**: Score docs with LLM queries for ranking. Then the score is used to choose the best answer.

### Evaluating LLM Applications: Comprehensive Assessment

Thoroughly evaluate LLMs with diverse methods:
1. **Data-driven Testing**: Employ questions and answers for correctness validation.
2. **LLM Test Generation (_QAGenerateChain_)**: Generate and validate Q&A pairs.
3. **Manual Evaluation with Debugging (_langchain.debug = True_)**: Analyze LLM steps.
4. **LLM-assisted Evaluation (_QAEvalChain_)**: Verify answers with another LLM.

Choose methods based on accuracy, efficiency, and required insights.

### LangChai Agents: Tailored Task Tools

Create task-specific tools using LangChai Agents. These tools perform designated functions, harnessing LLM capabilities for diverse applications.


---


## TLDR: LangChain Chat with Your Data

Learn to construct a chatbot using LangChain.
Find the code in the [`./fastify-ai`](./fastify-ai) folder.

The steps are:

1. **Document Loading**: Load documents from files or databases.
2. **Document Splitting**: Normalize documents into sentence-based chunks.
3. **Indexing**: Convert chunks into vectors and store in a vector database.
4. **Retrieval**: Fetch most relevant chunks for queries from the vector database and get the answer from the LLM.

### Document Loading

Refer to "lanchain markdown document loading" documentation.
Load documents from files or databases, a well-covered area.

### Document Splitting

Break documents into chunks considering context preservation. Splitting by sentences avoids model confusion.

A chunk comprises:
- Chunk Size: Character count.
- Chunk Overlap: Overlapping characters connecting chunks.
- Metadata: Additional data attached to the chunk. Eg: Title, author, etc.

Utilize the `splitter` function from the `langchain` library.

### Indexing

Convert chunks to vectors, storing them in a vector database as a knowledge repository.

Limitation:
- Ignores metadata look-up (e.g., queries about specific files).

### Retrieval

Retrieve semantically similar chunks from the vector database before passing them to the LLM.

Enhance results with:
- **Maximum Marginal Relevance (MMR)**: It will select the most relevant chunk and then it will select the most relevant chunk that is not similar to the first one adding **Diversity** to the result.
- **SelfQuery**: A question may contain some filters. "What are some movies made in 1989s?". So you can query the LLM to convert the user question into a query with filters and search terms. It adds **Specificity** to the result.
- **Compression**: Have LLM summarize relevant chunks for focused responses. It reduces the **Noise** and **Duplication**.

Fine-tune results for accuracy and relevance.
