import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

export class OGInference {
  private broker: any;
  private service_provider: any;

  private constructor(broker: any,service_provider: any) {
    this.broker = broker;
    this.service_provider = service_provider;
  }

  static async init(): Promise<OGInference> {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_OG_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY!, provider!);
    const broker = await createZGComputeNetworkBroker(wallet);
    const service_provider = process.env.MEXT_PUBLIC_OG_PROVIDER_ADDRESS!;
    return new OGInference(broker,service_provider);
  }

  private async callProvider(
    providerAddress: string,
    path: string,
    body: any
  ): Promise<any> {
    //  ack provider on-chain
    await this.broker.inference.acknowledgeProviderSigner(providerAddress);

    //  get endpoint + model metadata
    const { endpoint, model } = await this.broker.inference.getServiceMetadata(providerAddress);

    // sign request headers
    const headers = await this.broker.inference.getRequestHeaders(
      providerAddress,
      JSON.stringify(body)
    );

    //  send POST request
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

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.callProvider(this.service_provider, "/embeddings", { text });
    return result.embedding;
  }

  async generateSummary(text: string): Promise<string> {
    const result = await this.callProvider(this.service_provider, "/summarize", { text });
    return result.summary;
  }

  async recommendContent(
    userEmbedding: number[],
    contentEmbeddings: number[][]
  ): Promise<number[]> {
    const result = await this.callProvider(this.service_provider, "/recommend", {
      user_embedding: userEmbedding,
      content_embeddings: contentEmbeddings,
    });
    return result.scores;
  }
}

export const ogInference = await OGInference.init();