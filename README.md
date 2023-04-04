# gap3-defi-docs

This is a demo of a conversational search engine for DeFi documentation. It uses Pinecone to store and retrieve document embeddings, and OpenAI's GPT-4 to generate responses.


## Setup

After cloning the repo, follow these instructions:

1. Install packages
   ```sh
        npm install
    ```

2. Add OpenAI and Pinecone keys as environment variables

- create a `.env` file in the root of the folder
- copy the environmental variables from `.env.example` into `.env` and replace with the keys from respective websites
  - [openAI](https://platform.openai.com/account/api-keys)
  - [Pinecone](https://www.pinecone.io/)
- Create index from [Pinecone](https://www.pinecone.io/) website with `Dimensions` 1536 and `Metric` cosine.

## Usage

To run a specific example in the repo, simply run the bash script below:

-  ```sh
        npm run index
    ```
- ```sh
        npm run search
    ```



## Run Indexing


`npm run index`

## Run Searching

`npm run search`


