// Types de soldes Enable Banking : https://enablebanking.com/docs/api/reference/#balancestatus
export type BankBalance = {
  balance_type?: string;
  balance_amount: { amount: string; currency: string };
};

export function bankBalances(balances: BankBalance[]) {
  const byPriority = (types: string[]) => types.map(type => balances.find(balance => balance.balance_type === type)).find(Boolean);
  const booked = byPriority(["ITBD", "CLBD"]);
  const available = byPriority(["ITAV", "XPCD", "CLAV", "FWAV"]) ?? booked ?? balances[0];
  const amount = (balance: BankBalance) => {
    const value = Number(balance.balance_amount.amount);
    if (!balance.balance_amount.amount.trim() || !Number.isFinite(value)) throw new Error("Solde bancaire invalide");
    return value;
  };
  return {
    balance: available ? amount(available) : 0,
    bookedBalance: booked ? amount(booked) : null,
    currency: available?.balance_amount.currency ?? "EUR",
  };
}
