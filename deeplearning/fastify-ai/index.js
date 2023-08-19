import { join } from 'desm'
import dotenv from 'dotenv'

import { marked } from 'marked'
import { stripHtml } from 'string-strip-html'

import { Document } from 'langchain/document'
import { NotionLoader } from 'langchain/document_loaders/fs/notion'
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter' // ? does not work too well
// maybe: https://js.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/contextual_chunk_headers
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression'
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract'
import { RetrievalQAChain } from 'langchain/chains'
import { OpenAI } from 'langchain/llms/openai'
import { PromptTemplate } from 'langchain/prompts'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

async function run () {
  dotenv.config()
  const docs = await loadDocuments()
  console.log(`Loaded ${docs.length} documents`)

  const splitted = await splitDocuments(docs)
  console.log(`Splitted ${splitted.length} documents`)

  const store = await indexDocuments(splitted)
  console.log('Indexed documents')

  const query = 'who are the fastify contributors?'

  // Example 0: Simple retrieval
  {
    const answer = await retrievalWithEmbeddingsManually(query, store)
    console.log({ one: answer })
  }

  // Example 1: Simple retrieval
  {
    const answer = await retrievalWithEmbeddings(query, store)
    console.log({ two: answer })
  }

  // Example 2: Retrieval with Compressor
  {
    const answer = await retrievalWithCompressors(query, store)
    console.log({ three: answer })
  }

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
  function toPlain (token) {
    if (token.tokens?.length) {
      return token.tokens.map(toPlain).join('')
    }

    if (token.items?.length) {
      return token.items.map(toPlain).join('- ')
    }

    return token.text || '.'
  }

  function toMarkdownSliceDocument (mdDocument) {
    console.log(`Processing ${mdDocument.metadata.source}`)

    // require('fs').writeFileSync(`./0_raw_${mdDocument.metadata.source.split('/').at(-1)}.json`, JSON.stringify(mdDocument, null, 2))

    const tokens = marked.lexer(stripHtml(mdDocument.pageContent).result)
    // require('fs').writeFileSync(`./1_tokens_${mdDocument.metadata.source.split('/').at(-1)}.json`, JSON.stringify(tokens, null, 2))

    const byMainHeading = tokens.reduce((acc, token, i, array) => {
      const workingBlock = acc.workingBlock
      const shouldAddHeader = token.type === 'heading' && (workingBlock.headers.length === 0 || workingBlock.headers.at(-1)?.depth < token.depth)

      if (token.type === 'space') {
        newBlock()
        return acc
      }

      if (shouldAddHeader) {
        workingBlock.headers.push(token)
      } else {
        workingBlock.text += toPlain(token)
      }

      newBlock()

      const hasNext = !!array[i + 1]
      if (!hasNext) {
        acc.blocks.push(workingBlock)
      }

      return acc

      function newBlock () {
        const isNextHeading = array[i + 1]?.type === 'heading'
        if (isNextHeading) {
          if (workingBlock.text) {
            acc.blocks.push(workingBlock)
          }

          const nextDepth = array[i + 1].depth
          const headers = workingBlock.headers.filter(h => h.depth < nextDepth)

          if (token.type === 'heading' && !shouldAddHeader) {
            headers.push(token)
          }

          acc.workingBlock = {
            headers,
            text: ''
          }
        }
      }
    }, {
      workingBlock: {
        headers: [],
        text: ''
      },
      blocks: []
    })

    // require('fs').writeFileSync(`./2_byMain_${mdDocument.metadata.source.split('/').at(-1)}.json`, JSON.stringify(byMainHeading.blocks, null, 2))

    return byMainHeading.blocks.map(block => {
      const headers = block.headers.map(h => h.text)
      const lastTwoHeaders = headers.slice(-2)
      return new Document({
        pageContent: lastTwoHeaders.join(' > ') + ':' + block.text.replace(/\n/g, ' '),
        metadata: {
          source: mdDocument.metadata.source.split('/').at(-1),
          headers
        }
      })
    })
  }

  const cleaned = docs.flatMap(toMarkdownSliceDocument)

  // const splitter = RecursiveCharacterTextSplitter.fromLanguage('txt', {
  //   chunkSize: 500,
  //   chunkOverlap: 30
  // })
  const splitter = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 1000,
    chunkOverlap: 30
  })

  const splitted = await splitter.splitDocuments(cleaned)

  // require('fs').writeFileSync('./splittedOutput.json', JSON.stringify(splitted, null, 2))

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

async function retrievalWithEmbeddingsManually (query, vectorStore) {
  const howManyDocs = 4
  const similarDocs = await vectorStore.similaritySearch(query, howManyDocs)
  console.log(`Found ${similarDocs.length} similar documents`)

  console.log(similarDocs)

  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  const prompt = new PromptTemplate({
    template: `You are an expert on fastify and you have this additional context delimited by four plus signs
++++
{embeddings}
++++
Ansert the question: {query}`,
    inputVariables: ['embeddings', 'query']
  })

  const formattedPrompt = await prompt.format({
    embeddings: similarDocs.map(d => d.pageContent).join('\n'),
    query
  })

  const res = await model.predict(formattedPrompt)
  return res
}

async function retrievalWithEmbeddings (query, vectorStore) {
  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  const retriever = vectorStore.asRetriever()

  const chain = RetrievalQAChain.fromLLM(model, retriever)
  const res = await chain.call({ query })
  return res
}

async function retrievalWithCompressors (query, vectorStore) {
  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
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
