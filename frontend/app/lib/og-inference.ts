import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

export class OGInference {
  private broker: any;

  private constructor(broker: any) {
    this.broker = broker;
  }

  static async init(): Promise<OGInference> {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_OG_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const broker = await createZGComputeNetworkBroker(wallet);
    return new OGInference(broker);
  }

  private async callProvider(
    providerAddress: string,
    path: string,
    body: any
  ): Promise<any> {
    // 1. ack provider on-chain
    await this.broker.inference.acknowledgeProviderSigner(providerAddress);

    // 2. get endpoint + model metadata
    const { endpoint, model } = await this.broker.inference.getServiceMetadata(providerAddress);

    // 3. sign request headers
    const headers = await this.broker.inference.getRequestHeaders(
      providerAddress,
      JSON.stringify(body)
    );

    // 4. send POST request
    const resp = await fetch(`${endpoint}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ ...body, model }),
    });

    if (!resp.ok) {
      throw new Error(`Inference request failed: ${resp.statusText}`);
    }

    return resp.json();
  }

  async generateEmbedding(providerAddress: string, text: string): Promise<number[]> {
    const result = await this.callProvider(providerAddress, "/embeddings", { text });
    return result.embedding;
  }

  async generateSummary(providerAddress: string, text: string): Promise<string> {
    const result = await this.callProvider(providerAddress, "/summarize", { text });
    return result.summary;
  }

  async recommendContent(
    providerAddress: string,
    userEmbedding: number[],
    contentEmbeddings: number[][]
  ): Promise<number[]> {
    const result = await this.callProvider(providerAddress, "/recommend", {
      user_embedding: userEmbedding,
      content_embeddings: contentEmbeddings,
    });
    return result.scores;
  }
}
