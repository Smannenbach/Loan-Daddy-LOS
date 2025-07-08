import { nanoid } from 'nanoid';
import crypto from 'crypto';

export interface BlockchainTransaction {
  id: string;
  documentId: number;
  loanApplicationId: number;
  action: 'upload' | 'verify' | 'approve' | 'reject' | 'modify' | 'access';
  validator: string;
  timestamp: Date;
  hash: string;
  previousHash: string;
  metadata: Record<string, any>;
  signature: string;
}

export interface Block {
  index: number;
  timestamp: Date;
  transactions: BlockchainTransaction[];
  hash: string;
  previousHash: string;
  nonce: number;
  merkleRoot: string;
}

export interface DocumentVerification {
  documentId: number;
  isValid: boolean;
  lastVerified: Date;
  verificationHistory: Array<{
    timestamp: Date;
    validator: string;
    action: string;
    hash: string;
  }>;
  integrityScore: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
}

export interface DocumentCertificate {
  certificateId: string;
  documentId: number;
  issuedAt: Date;
  issuer: string;
  validUntil: Date;
  certificateHash: string;
  verificationUrl: string;
  metadata: {
    documentHash: string;
    blockchainProof: string;
    complianceChecks: string[];
    digitalSignature: string;
  };
}

export interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  totalDocuments: number;
  averageBlockTime: number;
  lastBlockHash: string;
  networkHealth: 'healthy' | 'warning' | 'critical';
  verificationRate: number;
  complianceScore: number;
}

export interface AuditResult {
  auditId: string;
  timestamp: Date;
  blocksAudited: number;
  transactionsAudited: number;
  integrityChecks: {
    passed: number;
    failed: number;
    total: number;
  };
  complianceChecks: {
    compliant: number;
    nonCompliant: number;
    total: number;
  };
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    blockIndex?: number;
    transactionId?: string;
  }>;
  recommendations: string[];
  overallScore: number;
}

export class BlockchainService {
  private static instance: BlockchainService;
  private blockchain: Block[] = [];
  private pendingTransactions: BlockchainTransaction[] = [];
  private difficulty = 2; // Mining difficulty
  private miningReward = 0; // No mining reward for document verification

  private constructor() {
    // Create genesis block
    this.createGenesisBlock();
  }

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date('2024-01-01T00:00:00Z'),
      transactions: [],
      hash: this.calculateHash(0, new Date('2024-01-01T00:00:00Z'), [], '0', 0),
      previousHash: '0',
      nonce: 0,
      merkleRoot: '0'
    };
    
    genesisBlock.hash = this.calculateHash(
      genesisBlock.index,
      genesisBlock.timestamp,
      genesisBlock.transactions,
      genesisBlock.previousHash,
      genesisBlock.nonce
    );
    
    this.blockchain.push(genesisBlock);
    console.log('Genesis block created for document verification blockchain');
  }

  async recordDocumentTransaction(params: {
    documentId: number;
    loanApplicationId: number;
    action: 'upload' | 'verify' | 'approve' | 'reject' | 'modify' | 'access';
    validator: string;
    metadata?: Record<string, any>;
  }): Promise<BlockchainTransaction> {
    try {
      const { documentId, loanApplicationId, action, validator, metadata = {} } = params;
      
      const transaction: BlockchainTransaction = {
        id: `tx_${nanoid(24)}`,
        documentId,
        loanApplicationId,
        action,
        validator,
        timestamp: new Date(),
        hash: '',
        previousHash: this.getLatestBlock().hash,
        metadata: {
          ...metadata,
          userAgent: 'LoanDaddy-BlockchainService/1.0',
          ipAddress: '127.0.0.1', // In real implementation, capture actual IP
          sessionId: nanoid(16)
        },
        signature: ''
      };

      // Calculate transaction hash
      transaction.hash = this.calculateTransactionHash(transaction);
      
      // Generate digital signature
      transaction.signature = this.generateSignature(transaction);
      
      // Add to pending transactions
      this.pendingTransactions.push(transaction);
      
      // Mine a new block if we have enough transactions or it's a critical action
      if (this.pendingTransactions.length >= 5 || this.isCriticalAction(action)) {
        await this.mineBlock();
      }
      
      console.log(`Blockchain transaction recorded: ${transaction.id} for document ${documentId}`);
      return transaction;
    } catch (error) {
      console.error('Error recording blockchain transaction:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  private async mineBlock(): Promise<Block> {
    const newBlock: Block = {
      index: this.blockchain.length,
      timestamp: new Date(),
      transactions: [...this.pendingTransactions],
      hash: '',
      previousHash: this.getLatestBlock().hash,
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot(this.pendingTransactions)
    };

    // Mine the block (proof of work)
    newBlock.hash = this.mineBlockHash(newBlock);
    
    // Add block to blockchain
    this.blockchain.push(newBlock);
    
    // Clear pending transactions
    this.pendingTransactions = [];
    
    console.log(`New block mined: #${newBlock.index} with ${newBlock.transactions.length} transactions`);
    return newBlock;
  }

  private mineBlockHash(block: Block): string {
    const target = Array(this.difficulty + 1).join('0');
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(
        block.index,
        block.timestamp,
        block.transactions,
        block.previousHash,
        block.nonce
      );
    }
    
    return block.hash;
  }

  private calculateHash(
    index: number,
    timestamp: Date,
    transactions: BlockchainTransaction[],
    previousHash: string,
    nonce: number
  ): string {
    const data = `${index}${timestamp.toISOString()}${JSON.stringify(transactions)}${previousHash}${nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateTransactionHash(transaction: Omit<BlockchainTransaction, 'hash' | 'signature'>): string {
    const data = `${transaction.id}${transaction.documentId}${transaction.loanApplicationId}${transaction.action}${transaction.validator}${transaction.timestamp.toISOString()}${JSON.stringify(transaction.metadata)}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateMerkleRoot(transactions: BlockchainTransaction[]): string {
    if (transactions.length === 0) return '0';
    
    const hashes = transactions.map(tx => tx.hash);
    return this.getMerkleRoot(hashes);
  }

  private getMerkleRoot(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    
    const newLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      newLevel.push(combined);
    }
    
    return this.getMerkleRoot(newLevel);
  }

  private generateSignature(transaction: Omit<BlockchainTransaction, 'signature'>): string {
    const data = `${transaction.hash}${transaction.validator}${transaction.timestamp.toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private isCriticalAction(action: string): boolean {
    return ['approve', 'reject', 'verify'].includes(action);
  }

  private getLatestBlock(): Block {
    return this.blockchain[this.blockchain.length - 1];
  }

  async verifyDocumentIntegrity(documentId: number): Promise<DocumentVerification> {
    try {
      // Find all transactions for this document
      const documentTransactions: Array<{
        transaction: BlockchainTransaction;
        blockIndex: number;
        verified: boolean;
      }> = [];

      this.blockchain.forEach((block, blockIndex) => {
        block.transactions.forEach(tx => {
          if (tx.documentId === documentId) {
            const verified = this.verifyTransaction(tx, block);
            documentTransactions.push({
              transaction: tx,
              blockIndex,
              verified
            });
          }
        });
      });

      // Calculate integrity score
      const totalTransactions = documentTransactions.length;
      const verifiedTransactions = documentTransactions.filter(dt => dt.verified).length;
      const integrityScore = totalTransactions > 0 ? (verifiedTransactions / totalTransactions) * 100 : 0;

      // Determine compliance status
      let complianceStatus: 'compliant' | 'non_compliant' | 'pending_review' = 'pending_review';
      if (integrityScore >= 95) {
        complianceStatus = 'compliant';
      } else if (integrityScore < 80) {
        complianceStatus = 'non_compliant';
      }

      // Build verification history
      const verificationHistory = documentTransactions.map(dt => ({
        timestamp: dt.transaction.timestamp,
        validator: dt.transaction.validator,
        action: dt.transaction.action,
        hash: dt.transaction.hash
      }));

      return {
        documentId,
        isValid: integrityScore >= 80,
        lastVerified: new Date(),
        verificationHistory,
        integrityScore,
        complianceStatus
      };
    } catch (error) {
      console.error('Error verifying document integrity:', error);
      throw new Error(`Document verification failed: ${error.message}`);
    }
  }

  private verifyTransaction(transaction: BlockchainTransaction, block: Block): boolean {
    // Verify transaction hash
    const expectedHash = this.calculateTransactionHash({
      id: transaction.id,
      documentId: transaction.documentId,
      loanApplicationId: transaction.loanApplicationId,
      action: transaction.action,
      validator: transaction.validator,
      timestamp: transaction.timestamp,
      previousHash: transaction.previousHash,
      metadata: transaction.metadata
    });

    if (expectedHash !== transaction.hash) {
      return false;
    }

    // Verify signature
    const expectedSignature = this.generateSignature({
      ...transaction,
      signature: '' // Exclude signature from signature calculation
    });

    return expectedSignature === transaction.signature;
  }

  async generateDocumentCertificate(documentId: number): Promise<DocumentCertificate> {
    try {
      const verification = await this.verifyDocumentIntegrity(documentId);
      
      if (!verification.isValid) {
        throw new Error('Cannot generate certificate for invalid document');
      }

      const certificateId = `cert_${nanoid(24)}`;
      const now = new Date();
      const validUntil = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // Valid for 1 year

      // Find the latest document hash
      const latestTransaction = verification.verificationHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      const certificate: DocumentCertificate = {
        certificateId,
        documentId,
        issuedAt: now,
        issuer: 'LoanDaddy Blockchain Verification Service',
        validUntil,
        certificateHash: '',
        verificationUrl: `https://verify.loandaddy.com/certificate/${certificateId}`,
        metadata: {
          documentHash: latestTransaction?.hash || '',
          blockchainProof: this.getLatestBlock().hash,
          complianceChecks: [
            'Document Integrity Verified',
            'Blockchain Hash Confirmed',
            'Digital Signature Valid',
            'Compliance Status: ' + verification.complianceStatus
          ],
          digitalSignature: ''
        }
      };

      // Generate certificate hash
      const certData = `${certificateId}${documentId}${now.toISOString()}${validUntil.toISOString()}${certificate.metadata.documentHash}`;
      certificate.certificateHash = crypto.createHash('sha256').update(certData).digest('hex');
      
      // Generate digital signature for certificate
      certificate.metadata.digitalSignature = crypto.createHash('sha256')
        .update(certificate.certificateHash + certificate.issuer)
        .digest('hex');

      console.log(`Document certificate generated: ${certificateId} for document ${documentId}`);
      return certificate;
    } catch (error) {
      console.error('Error generating document certificate:', error);
      throw new Error(`Certificate generation failed: ${error.message}`);
    }
  }

  async getBlockchainStats(): Promise<BlockchainStats> {
    try {
      const totalBlocks = this.blockchain.length;
      const totalTransactions = this.blockchain.reduce((sum, block) => sum + block.transactions.length, 0);
      
      // Get unique documents
      const documentIds = new Set<number>();
      this.blockchain.forEach(block => {
        block.transactions.forEach(tx => {
          documentIds.add(tx.documentId);
        });
      });
      const totalDocuments = documentIds.size;

      // Calculate average block time
      let totalBlockTime = 0;
      for (let i = 1; i < this.blockchain.length; i++) {
        const timeDiff = this.blockchain[i].timestamp.getTime() - this.blockchain[i - 1].timestamp.getTime();
        totalBlockTime += timeDiff;
      }
      const averageBlockTime = this.blockchain.length > 1 ? totalBlockTime / (this.blockchain.length - 1) : 0;

      // Calculate verification rate (percentage of verified transactions)
      let verifiedTransactions = 0;
      this.blockchain.forEach(block => {
        block.transactions.forEach(tx => {
          if (this.verifyTransaction(tx, block)) {
            verifiedTransactions++;
          }
        });
      });
      const verificationRate = totalTransactions > 0 ? (verifiedTransactions / totalTransactions) * 100 : 100;

      // Calculate compliance score
      const complianceScore = verificationRate; // Simplified calculation

      // Determine network health
      let networkHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (verificationRate < 95) networkHealth = 'warning';
      if (verificationRate < 80) networkHealth = 'critical';

      return {
        totalBlocks,
        totalTransactions,
        totalDocuments,
        averageBlockTime: Math.round(averageBlockTime / 1000), // Convert to seconds
        lastBlockHash: this.getLatestBlock().hash,
        networkHealth,
        verificationRate: Math.round(verificationRate * 100) / 100,
        complianceScore: Math.round(complianceScore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      throw new Error(`Failed to retrieve blockchain stats: ${error.message}`);
    }
  }

  async auditBlockchain(): Promise<AuditResult> {
    try {
      const auditId = `audit_${nanoid(24)}`;
      const timestamp = new Date();
      
      let integrityPassed = 0;
      let integrityFailed = 0;
      let compliantCount = 0;
      let nonCompliantCount = 0;
      const issues: AuditResult['issues'] = [];

      // Audit each block
      for (let i = 0; i < this.blockchain.length; i++) {
        const block = this.blockchain[i];
        
        // Verify block hash
        const expectedHash = this.calculateHash(
          block.index,
          block.timestamp,
          block.transactions,
          block.previousHash,
          block.nonce
        );
        
        if (expectedHash !== block.hash) {
          integrityFailed++;
          issues.push({
            severity: 'critical',
            type: 'Block Hash Mismatch',
            description: `Block #${i} hash does not match expected value`,
            blockIndex: i
          });
        } else {
          integrityPassed++;
        }

        // Audit transactions in the block
        for (const transaction of block.transactions) {
          const isValid = this.verifyTransaction(transaction, block);
          
          if (isValid) {
            compliantCount++;
          } else {
            nonCompliantCount++;
            issues.push({
              severity: 'high',
              type: 'Transaction Verification Failed',
              description: `Transaction ${transaction.id} failed verification`,
              blockIndex: i,
              transactionId: transaction.id
            });
          }
        }
      }

      // Check chain continuity
      for (let i = 1; i < this.blockchain.length; i++) {
        if (this.blockchain[i].previousHash !== this.blockchain[i - 1].hash) {
          issues.push({
            severity: 'critical',
            type: 'Chain Continuity Broken',
            description: `Block #${i} previous hash does not match block #${i - 1} hash`,
            blockIndex: i
          });
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
      const highIssues = issues.filter(issue => issue.severity === 'high').length;

      if (criticalIssues > 0) {
        recommendations.push(`Address ${criticalIssues} critical blockchain integrity issues immediately`);
        recommendations.push('Consider rebuilding affected blocks from backup');
      }

      if (highIssues > 0) {
        recommendations.push(`Review ${highIssues} high-priority transaction verification failures`);
      }

      if (issues.length === 0) {
        recommendations.push('Blockchain integrity is excellent - continue current practices');
        recommendations.push('Consider increasing audit frequency as the blockchain grows');
      }

      // Calculate overall score
      const totalChecks = integrityPassed + integrityFailed + compliantCount + nonCompliantCount;
      const passedChecks = integrityPassed + compliantCount;
      const overallScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

      return {
        auditId,
        timestamp,
        blocksAudited: this.blockchain.length,
        transactionsAudited: this.blockchain.reduce((sum, block) => sum + block.transactions.length, 0),
        integrityChecks: {
          passed: integrityPassed,
          failed: integrityFailed,
          total: integrityPassed + integrityFailed
        },
        complianceChecks: {
          compliant: compliantCount,
          nonCompliant: nonCompliantCount,
          total: compliantCount + nonCompliantCount
        },
        issues,
        recommendations,
        overallScore: Math.round(overallScore * 100) / 100
      };
    } catch (error) {
      console.error('Error auditing blockchain:', error);
      throw new Error(`Blockchain audit failed: ${error.message}`);
    }
  }
}

export const blockchainService = BlockchainService.getInstance();