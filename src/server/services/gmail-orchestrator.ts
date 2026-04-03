/**
 * Gmail Purchase Sync Orchestrator
 *
 * Reads purchase confirmation emails from Gmail and creates Item records.
 * Requires a valid OAuth2 access token with Gmail readonly scope.
 */

interface SyncResult {
  newItems: number;
  skipped: number;
  errors: string[];
}

export async function syncPurchases(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
): Promise<SyncResult> {
  // TODO: Implement Gmail API integration
  // 1. Use accessToken to call Gmail API (messages.list with q:"subject:(注文確認 OR order confirmation)")
  // 2. Parse purchase details from email body
  // 3. Create Item records via Prisma
  // 4. Return counts

  void userId;
  void accessToken;
  void refreshToken;

  return {
    newItems: 0,
    skipped: 0,
    errors: ['Gmail同期は現在開発中です。'],
  };
}
