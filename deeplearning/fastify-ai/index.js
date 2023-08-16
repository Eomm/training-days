import { join } from 'desm'
import dotenv from 'dotenv'

import { NotionLoader } from 'langchain/document_loaders/fs/notion'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression'
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract'
import { RetrievalQAChain } from 'langchain/chains'
import { OpenAI } from 'langchain/llms/openai'

async function run () {
  dotenv.config()
  const docs = await loadDocuments()
  console.log(`Loaded ${docs.length} documents`)

  const splitted = await splitDocuments(docs)
  console.log(`Splitted ${splitted.length} documents`)

  const store = await indexDocuments(splitted)
  console.log('Indexed documents')

  const query = 'who are the fastify maintainers?'

  // Example 1: Simple retrieval
  // const howManyDocs = 2
  // const similarDocs = await store.similaritySearch(query, howManyDocs)
  // console.log(similarDocs)

  const answer = await retrieval(query, store)
  console.log(answer)

  // todo: retrieval with metadata
  // https://js.langchain.com/docs/modules/data_connection/retrievers/how_to/vectorstore
}

async function loadDocuments () {
  const directoryPath = join(import.meta.url, 'docs/demo')
  const loader = new NotionLoader(directoryPath)
  const docs = await loader.load()
  return docs
};

async function splitDocuments (docs) {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 150,
    chunkOverlap: 15
  })
  const splitted = await splitter.splitDocuments(docs)
  return splitted
}

async function indexDocuments (splitted) {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY
  })

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitted,
    embeddings
  )
  return vectorStore
}

async function retrieval (query, vectorStore) {
  const model = new OpenAI({
    // modelName: 'gpt-3.5-turbo',
    openAIApiKey: process.env.OPENAI_API_KEY
  })
  const baseCompressor = LLMChainExtractor.fromLLM(model)

  const retriever = new ContextualCompressionRetriever({
    baseCompressor,
    baseRetriever: vectorStore.asRetriever()
  })

  const chain = RetrievalQAChain.fromLLM(model, retriever)
  const res = await chain.call({ query })
  return res
}

run()
