/**
 * Rent vs buy: compares net worth after N years.
 * - Buyer: pays down payment + closing costs, then mortgage, property tax, insurance, maintenance and HOA;
 *   at the end sells the home (minus selling costs) and repays the loan.
 * - Renter: invests what the buyer paid upfront, pays rent and renters insurance.
 * - Each month, whoever spends less invests the difference at the investment return.
 * Simulated monthly in decimal arithmetic. Tax effects (mortgage interest deduction, capital gains) are not modelled.
 */
import { annuityPayment, cents, D, monthlyRate } from '../../lib/math/money.ts';

export interface RentBuyInput extends Record<string, unknown> {
  years: number;
  homePrice: number;
  downPct: number;
  interestRate: number;
  termYears: number;
  propertyTaxRate: number;
  /** Annual insurance, dollars (grows with home value). */
  homeInsurance: number;
  /** Annual maintenance, % of home value. */
  maintenancePct: number;
  hoa: number;
  appreciation: number;
  buyClosingPct: number;
  sellClosingPct: number;
  rent: number;
  rentIncrease: number;
  rentersInsurance: number;
  investReturn: number;
}

export interface RentBuyYear {
  year: number;
  buyerNetWorth: number;
  renterNetWorth: number;
  /** Buyer minus renter. */
  advantage: number;
  buyCostYear: number;
  rentCostYear: number;
}

export interface RentBuyOutput {
  upfront: number;
  loanAmount: number;
  monthlyPI: number;
  firstMonthBuy: number;
  firstMonthRent: number;
  homeValueEnd: number;
  loanBalanceEnd: number;
  buyerNetWorth: number;
  renterNetWorth: number;
  /** Positive: buying leaves you richer; negative: renting does. */
  advantage: number;
  /** First year in which buying comes out ahead (null if never within the horizon). */
  breakEvenYear: number | null;
  totalBuyCost: number;
  totalRentCost: number;
  years: RentBuyYear[];
}

export function computeRentBuy(i: RentBuyInput): RentBuyOutput {
  const months = Math.max(1, Math.round(i.years * 12));
  const price = D(i.homePrice);
  const down = cents(price.times(i.downPct).div(100));
  const loan = cents(price.minus(down));
  const n = Math.max(1, Math.round(i.termYears * 12));
  const r = monthlyRate(i.interestRate);
  const pi = loan.gt(0) ? cents(annuityPayment(loan, r, n)) : D(0);
  const upfront = cents(down.plus(price.times(i.buyClosingPct).div(100)));

  const gMonthly = D(i.appreciation).div(100).plus(1).ln().div(12).exp(); // (1+g)^(1/12)
  const invMonthly = D(i.investReturn).div(100).plus(1).ln().div(12).exp().minus(1);
  const rentGrowth = D(i.rentIncrease).div(100).plus(1);

  let value = price;
  let balance = loan;
  let rent = D(i.rent);
  let buyerInv = D(0);
  let renterInv = upfront;
  let buyCostTotal = upfront;
  let rentCostTotal = D(0);
  let yearBuy = D(0);
  let yearRent = D(0);
  let firstMonthBuy = D(0);
  let firstMonthRent = D(0);
  const years: RentBuyYear[] = [];
  let breakEvenYear: number | null = null;

  for (let m = 1; m <= months; m++) {
    if (m > 1 && (m - 1) % 12 === 0) rent = rent.times(rentGrowth);
    // Buyer's costs this month (tax, insurance, maintenance scale with the home's current value).
    const interest = cents(balance.times(r));
    const principal = balance.gt(0) ? (pi.minus(interest).gt(balance) ? balance : pi.minus(interest)) : D(0);
    const mortgage = balance.gt(0) ? interest.plus(principal) : D(0);
    balance = balance.minus(principal);
    const growthFactor = value.div(price);
    const ownCosts = value.times(i.propertyTaxRate).div(1200).plus(D(i.homeInsurance).times(growthFactor).div(12)).plus(value.times(i.maintenancePct).div(1200)).plus(i.hoa);
    const buyMonth = mortgage.plus(ownCosts);
    const rentMonth = rent.plus(D(i.rentersInsurance).div(12));
    if (m === 1) {
      firstMonthBuy = buyMonth;
      firstMonthRent = rentMonth;
    }
    // Investments grow, then the cheaper side invests the difference.
    buyerInv = buyerInv.times(invMonthly.plus(1));
    renterInv = renterInv.times(invMonthly.plus(1));
    const diff = buyMonth.minus(rentMonth);
    if (diff.gt(0)) renterInv = renterInv.plus(diff);
    else buyerInv = buyerInv.plus(diff.neg());
    value = value.times(gMonthly);
    buyCostTotal = buyCostTotal.plus(buyMonth);
    rentCostTotal = rentCostTotal.plus(rentMonth);
    yearBuy = yearBuy.plus(buyMonth);
    yearRent = yearRent.plus(rentMonth);

    if (m % 12 === 0 || m === months) {
      const equity = value.times(D(1).minus(D(i.sellClosingPct).div(100))).minus(balance);
      const buyerNW = equity.plus(buyerInv);
      const year = Math.ceil(m / 12);
      const adv = buyerNW.minus(renterInv);
      years.push({
        year,
        buyerNetWorth: cents(buyerNW).toNumber(),
        renterNetWorth: cents(renterInv).toNumber(),
        advantage: cents(adv).toNumber(),
        buyCostYear: cents(yearBuy).toNumber(),
        rentCostYear: cents(yearRent).toNumber(),
      });
      if (breakEvenYear === null && adv.gte(0)) breakEvenYear = year;
      yearBuy = D(0);
      yearRent = D(0);
    }
  }
  const last = years.at(-1)!;
  return {
    upfront: upfront.toNumber(),
    loanAmount: loan.toNumber(),
    monthlyPI: pi.toNumber(),
    firstMonthBuy: cents(firstMonthBuy).toNumber(),
    firstMonthRent: cents(firstMonthRent).toNumber(),
    homeValueEnd: cents(value).toNumber(),
    loanBalanceEnd: cents(balance).toNumber(),
    buyerNetWorth: last.buyerNetWorth,
    renterNetWorth: last.renterNetWorth,
    advantage: last.advantage,
    breakEvenYear,
    totalBuyCost: cents(buyCostTotal).toNumber(),
    totalRentCost: cents(rentCostTotal).toNumber(),
    years,
  };
}
