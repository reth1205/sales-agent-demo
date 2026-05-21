import { state } from './store';
import type { ScheduledVisit } from './types';

export const getAccount = (accountId: string) => state.crm.accounts.find((account) => account.id === accountId);

export const getVisitAccount = (visit: ScheduledVisit) => getAccount(visit.accountId);

export const getOpenOpportunity = (accountId: string) =>
  state.crm.opportunities.find((opportunity) => opportunity.accountId === accountId);
