import { ethers } from 'ethers';

export class RelayerClient {
  private baseUrl: string;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.signer = signer;
  }

  async relayTransaction(
    to: string,
    data: string,
    value: bigint = BigInt(0)
  ): Promise<{ txHash: string; cost: string }> {
    try {
      const userAddress = await this.signer.getAddress();
      
      // Sign message for authentication
      const message = `Relay transaction for ${userAddress}`;
      const signature = await this.signer.signMessage(message);

      const response = await fetch(`${this.baseUrl}/api/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to, 
          data, 
          value: value.toString(), 
          userAddress, 
          signature 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Relayer error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Relay failed:', error);
      throw error;
    }
  }

  async login(): Promise<{ token: string }> {
    try {
      const userAddress = await this.signer.getAddress();
      const message = `Login to ChainChatAI at ${Date.now()}`;
      const signature = await this.signer.signMessage(message);

      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, signature })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Login failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/relay/status`);
      if (!response.ok) {
        throw new Error('Failed to get relayer status');
      }
      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  // Batch multiple transactions for efficiency
  async relayBatch(transactions: Array<{ to: string; data: string; value?: bigint }>) {
    const results = [];
    
    for (const tx of transactions) {
      try {
        const result = await this.relayTransaction(tx.to, tx.data, tx.value || BigInt(0));
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    
    return results;
  }
}

// Singleton instance with React Hook integration
let relayerInstance: RelayerClient | null = null;

export const getRelayerClient = (signer: ethers.Signer): RelayerClient => {
  if (!relayerInstance) {
    relayerInstance = new RelayerClient(signer);
  }
  return relayerInstance;
};