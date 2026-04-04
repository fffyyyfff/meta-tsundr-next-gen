import { checkPriceChanges } from "../../services/price-tracker";

interface CheckPricesInput {
  userId?: string;
}

export async function checkPricesHandler({ input }: { input: CheckPricesInput }) {
  const userId = input.userId ?? "default-user";
  return checkPriceChanges(userId);
}
