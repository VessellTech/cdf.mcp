import type { ToolDef } from "../types.js";
import { accountTools } from "./accounts.js";
import { cardTools } from "./cards.js";
import { categoryTools } from "./categories.js";
import { transactionTools } from "./transactions.js";
import { recurringTools } from "./recurring.js";
import { invoiceTools } from "./invoices.js";
import { goalBudgetDebtTools } from "./goals-budgets-debts.js";
import { equityTools } from "./equities.js";
import { insightTools } from "./insights.js";
import { userTools } from "./user.js";

export const toolCatalog: ToolDef[] = [
  ...userTools,
  ...accountTools,
  ...cardTools,
  ...categoryTools,
  ...transactionTools,
  ...recurringTools,
  ...invoiceTools,
  ...goalBudgetDebtTools,
  ...equityTools,
  ...insightTools,
];
