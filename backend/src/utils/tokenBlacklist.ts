/**
 * In-memory Token Revocation Blacklist for Session Invalidation & Logout
 * Tokens are stored until their natural JWT expiration, preventing memory growth.
 */
class TokenBlacklistService {
  private blacklistedTokens = new Map<string, number>();

  constructor() {
    // Periodically prune expired tokens every 30 minutes
    setInterval(() => {
      this.pruneExpiredTokens();
    }, 30 * 60 * 1000).unref();
  }

  /**
   * Blacklist a token until its expiration time
   */
  revoke(token: string, expiresAtTimestampMs: number): void {
    this.blacklistedTokens.set(token, expiresAtTimestampMs);
  }

  /**
   * Check if a token has been explicitly revoked
   */
  isRevoked(token: string): boolean {
    const expiresAt = this.blacklistedTokens.get(token);
    if (!expiresAt) {
      return false;
    }

    if (Date.now() > expiresAt) {
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired tokens
   */
  private pruneExpiredTokens(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.blacklistedTokens.entries()) {
      if (now > expiresAt) {
        this.blacklistedTokens.delete(token);
      }
    }
  }

  /**
   * Clear all for testing
   */
  clear(): void {
    this.blacklistedTokens.clear();
  }
}

export const tokenBlacklist = new TokenBlacklistService();
