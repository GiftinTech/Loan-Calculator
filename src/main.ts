import { Chart } from 'chart.js/auto';
import dayjs from 'dayjs';

let myChart: Chart | null = null;

// DOM

const formPlaceholder = document.querySelector('.js-form-placeholder') as HTMLDivElement;
const summaryPlaceholder = document.querySelector('.js-summary-placeholder') as HTMLDivElement;
const schedulePlaceholder = document.querySelector('.js-schedule-placeholder') as HTMLDivElement;

//  Utility: convert a (years, months) pair into totalMonths  ⇢ number of payment periods yearsPart ⇢ whole-years portion monthsPart ⇢ leftover months

function normaliseTerm(years: number | undefined, months: number | undefined) {
  const y = years ?? 0;
  const m = months ?? 0;

  // if user typed only months, y will be 0
  // if user typed only years,  m will be 0
  const totalMonths = y * 12 + m;

  // derive “X years Y months” for display
  const yearsPart = Math.floor(totalMonths / 12);
  const monthsPart = totalMonths % 12;

  return { totalMonths, yearsPart, monthsPart };
}

// type aliases
export type LoanDetails = {
  amount: number;
  interestRate: number;
  loanTermYears?: number;
  loanTermMonths?: number;
  startDate: string;
};

type PaymentDetails = {
  monthlyPayment: number;
  monthlyInterest: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  interest: number;
  calculatedYears: number;
  calculatedMonths: number;
  calculatedInterest: number;
  start: Date;
  last: Date;
};

interface SummaryEntry {
  monthlyPayment: number;
  totalPayment: number;
  principal: number;
  totalInterest: number;
  installmentNum: number;
  interestRate: number;
  calculatedYears: number;
  calculatedMonths: number;
  start: Date;
  last: Date;
}
const summary: SummaryEntry[] = [];

interface ScheduleEntry {
  date: string;
  monthlyPayment: number;
  interest: number;
  principal: number;
  balance: number;
}
const schedule: ScheduleEntry[] = [];

// Utility function: formats figures with commas
/** remove every comma before calculations */
export const stripCommas = (val: string) => val.replace(/,/g, '');

function numberWithCommas(x: number | string) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function initLiveFormatting(el: HTMLInputElement) {
  el.addEventListener('input', () => {
    const raw = stripCommas(el.value);
    if (!raw) {
      el.value = '';
      return;
    }
    el.value = numberWithCommas(raw);
  });
  el.addEventListener('blur', () => (el.value = numberWithCommas(el.value)));
}

// Loan calculation functionality
export const calculateLoan = ({
  amount,
  interestRate,
  loanTermYears,
  loanTermMonths,
  startDate,
}: LoanDetails): PaymentDetails => {
  // normalise the loan term
  const { totalMonths, yearsPart, monthsPart } = normaliseTerm(loanTermYears, loanTermMonths);

  if (totalMonths === 0) throw new Error('Loan term must be at least one month');

  // maths
  const principal = amount;
  const interest = interestRate;
  const monthlyRate = interestRate / 100 / 12;
  const interestGrowth = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = (principal * interestGrowth * monthlyRate) / (interestGrowth - 1);

  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principal;
  const firstMonthlyInterest = principal * monthlyRate;

  // dates
  const loanStart = new Date(startDate);
  const loanEnd = new Date(loanStart);
  loanEnd.setMonth(loanEnd.getMonth() + totalMonths);

  // return
  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    monthlyInterest: Number(firstMonthlyInterest.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    principal,
    interest,
    calculatedYears: yearsPart,
    calculatedMonths: monthsPart,
    calculatedInterest: monthlyRate,
    start: loanStart,
    last: loanEnd,
  };
};

const toggleNavLink = (
  clickElement: HTMLLIElement,
  value: HTMLElement,
  element1: HTMLElement,
  element2: HTMLElement
): void => {
  if (!clickElement) return;

  clickElement.addEventListener('click', () => {
    if (!value || !element1 || !element2) return; // safety net

    // hide others, show the clicked one
    element1.style.display = 'none';
    element2.style.display = 'none';
    value.style.display = 'block';
  });
};

// Render form

function renderForm() {
  const formHTML = `
    <form action="https://httpbin.org/get" method="get" name="loanDetailsForm">
      <label class="form-header">Calculate loan interest</label>

      <label for="loan-amount"> Loan Amount </label>
      <div class="amount-wrapper">
        <span class="naira-symbol">₦</span>
        <input
          type="text"
          id="loan-amount"
          class="loan-input amount-input js-loan-amount"
          placeholder="Enter loan amount"
          required
        />
      </div>

      <label for="loan-interest"> Annual Interest Rate </label>
      <div class="interest-wrapper">
        <span class="percentage-symbol">%</span>
        <input
          type="number"
          id="loan-interest"
          class="loan-input js-loan-interest"
          placeholder="Enter loan Interest"
          required
        />
      </div>

      <label> Loan Term <span class="per-term">per/anum</span></label>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-years"
          placeholder="Enter loan term in"
        />

      <label> Loan Term <span class="per-term">per/month</span></label>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-month"
          placeholder="Enter loan term in"
        />
      
      <label for="start-date"> Start Date </label>
      <input type="date" class="loan-input loan-start-date js-loan-start-date" />

      <input
        class="loan-input calculate-loan js-calculate-loan"
        value="Calculate"
        type="submit"
      />
    </form>
  `;

  formPlaceholder.innerHTML = formHTML;
  // --- Auto input rendering logic ---
  const yearsInput = document.querySelector('.js-loan-term-years') as HTMLInputElement;
  const monthsInput = document.querySelector('.js-loan-term-month') as HTMLInputElement;

  // When months is filled, show equivalent years as placeholder in years input
  monthsInput.addEventListener('input', () => {
    const months = parseInt(monthsInput.value, 10);
    if (!isNaN(months) && months > 0) {
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      yearsInput.placeholder =
        years > 0 && remMonths > 0
          ? `${years} year(s) ${remMonths} month(s)`
          : years > 0
          ? `${years} year(s)`
          : `${remMonths} month(s)`;
    } else {
      yearsInput.placeholder = 'Enter loan term in';
    }
  });

  // When years is filled, show equivalent months as placeholder in months input
  yearsInput.addEventListener('input', () => {
    const years = parseInt(yearsInput.value, 10);
    if (!isNaN(years) && years > 0) {
      monthsInput.placeholder = `${years * 12} month(s)`;
    } else {
      monthsInput.placeholder = 'Enter loan term in';
    }
  });
}

// Render summary table
function renderSummaryTable() {
  console.log('renderSummaryTable called', summary);

  // If no data, show message and return
  if (!summary.length) {
    summaryPlaceholder.innerHTML = `
      <div class="loan-summary-table js-summary-table">
        <table>
          <caption>Loan Summary Result</caption>
          <thead>
            <tr><th colspan="2">Payment Breakdown</th></tr>
          </thead>
          <tbody id="summary-body">
            <tr>
              <td colspan="2" style="text-align: center; font-style: italic;">
                No summary data yet
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right"><em>Download to CSV</em></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return; // stop here
  }

  // Build rows string from summary data
  const rows = summary
    .map(
      (e) => `
      <tr>
        <td>Monthly Repayment</td>
        <td>${e.monthlyPayment.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Total Loan Payment</td>
        <td>${e.totalPayment.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Loan Amount</td>
        <td>${e.principal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Total Interest</td>
        <td>${e.totalInterest.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Number of Installments</td>
        <td>12</td>
      </tr>
      <tr>
        <td>Interest Rate per annum</td>
        <td>${e.interestRate.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Loan Term</td>
        <td>${e.calculatedYears} year(s) ${e.calculatedMonths} month(s)</td>
      </tr>
      <tr>
        <td>First Payment Date</td>
        <td>${dayjs(e.start).format('DD MMM, YYYY')}</td>
      </tr>
      <tr>
        <td>Last Payment Date</td>
        <td>${dayjs(e.last).format('DD MMM, YYYY')}</td>
      </tr>
    `
    )
    .join('');

  // If the table is not yet rendered, inject it with empty tbody
  if (!document.querySelector('.js-summary-table')) {
    summaryPlaceholder.innerHTML = `
      <div class="loan-summary-table js-summary-table">
        <table>
          <caption>Loan Summary Result</caption>
          <thead>
            <tr><th colspan="2">Payment Breakdown</th></tr>
          </thead>
          <tbody id="summary-body"></tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right"><em>Download to CSV</em></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Now update tbody with rows
  const tbody = document.getElementById('summary-body');
  if (tbody) tbody.innerHTML = rows;
}

// Render schedule table
function renderScheduleTable() {
  console.log('renderScheduleTable called', schedule);
  if (!document.querySelector('.js-loan-schedule-table')) {
    schedulePlaceholder.innerHTML = `
    <div class="loan-schedule-table js-loan-schedule-table">
      <div class="estimated-payoff">
        <h1>Estimated payoff date</h1>
        <p class="payoff-p">—</p>

        <h2>Current Balance</h2>
        <p class="bal-p">—</p>
      </div>

      <table>
        <caption>Amortisation Schedule</caption>
        <thead>
          <tr class="schedule-th">
            <th>Payment Date</th>
            <th>Monthly Repayment</th>
            <th>Interest</th>
            <th>Principal</th>
            <th>Current Balance</th>
          </tr>
        </thead>
        <tbody id="schedule-body"></tbody>
        <tfoot>
          <tr>
            <td>Payment Date</td>
            <td>Monthly Repayment</td>
            <td>Interest</td>
            <td>Principal</td>
            <td>Current Balance</td>
          </tr>
          <tr>
            <td colspan="5" style="text-align:right">
              <button id="downloadCsvBtn">
                ⬇️<em>Download to CSV</em>
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>`;
  }

  const tbody = document.getElementById('schedule-body')!;
  if (!schedule.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center">No schedule data yet</td></tr>';
    return;
  }

  const rows = schedule
    .map((e) => {
      const today = dayjs();
      const rowClass = dayjs(e.date).isSame(today, 'month')
        ? 'current-payment'
        : dayjs(e.date).isBefore(today, 'month')
        ? 'past-payment'
        : 'future-payment';

      // console.log({
      //   rowDate: dayjs(e.date).format(),
      //   today: today.format(),
      //   class: rowClass,
      // });

      return `
      <tr class="${rowClass}">
        <td>${e.date}</td>
        <td>₦${e.monthlyPayment.toLocaleString()}</td>
        <td>₦${e.interest.toLocaleString()}</td>
        <td>₦${e.principal.toLocaleString()}</td>
        <td>₦${e.balance.toLocaleString()}</td>
      </tr>`;
    })
    .join('');
  tbody.innerHTML = rows;

  // update payoff date
  const pDate = schedule.at(-1)!.date ?? '';
  const formatPDate = pDate ? dayjs(pDate).format('D MMMM, YYYY') : '';
  (document.querySelector('.estimated-payoff .payoff-p') as HTMLElement).textContent = formatPDate;

  //update current month date
  const today = dayjs();
  const currentEntry = schedule.find(
    (e) => dayjs(e.date).isSame(today, 'month') // compare by month+year
  );
  const currentBal: number | null = currentEntry ? currentEntry.balance : null;

  // console.log('Formatted current month:', today);
  // console.log('Formatted current entry:', currentEntry);
  // console.log('Formatted current balance:', currentBal);

  const balElem = document.querySelector('.estimated-payoff .bal-p') as HTMLElement | null;
  if (balElem) {
    balElem.textContent = currentBal !== null ? `₦${currentBal.toLocaleString()}` : '—'; // show balance or dash
  }

  document.getElementById('downloadCsvBtn')?.addEventListener('click', () => {
    const csvHeaders = [
      'Payment Date',
      'Monthly Repayment',
      'Interest',
      'Principal',
      'Current Balance',
    ];
    const csvRows = schedule.map((entry) =>
      [entry.date, entry.monthlyPayment, entry.interest, entry.principal, entry.balance].join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'loan_schedule.csv';
    link.click();
  });
}

// Preprocessing the user input functionality
export const inputPreprocessing = (ctx: HTMLCanvasElement) => {
  const form = document.querySelector('form[name="loanDetailsForm"]') as HTMLFormElement;
  if (!form) {
    console.error('Loan form not found in DOM');
    return;
  }

  const amountInput = form.querySelector('.js-loan-amount') as HTMLInputElement;
  const rateInput = form.querySelector('.js-loan-interest') as HTMLInputElement;
  const yearsInput = form.querySelector('.js-loan-term-years') as HTMLInputElement;
  const monthsInput = form.querySelector('.js-loan-term-month') as HTMLInputElement;
  const startInput = form.querySelector('.js-loan-start-date') as HTMLInputElement;
  const calcButton = form.querySelector('.js-calculate-loan') as HTMLInputElement;

  initLiveFormatting(amountInput);

  calcButton.addEventListener('click', (e) => {
    e.preventDefault();

    const loanDetails: LoanDetails = {
      amount: parseFloat(stripCommas(amountInput.value)),
      interestRate: parseFloat(rateInput.value),
      loanTermYears: parseInt(yearsInput.value, 10) || undefined,
      loanTermMonths: parseInt(monthsInput.value, 10) || undefined,
      startDate: startInput.value,
    };

    console.log(loanDetails);

    /* clear & keyboard nav */
    const inputs = [amountInput, rateInput, yearsInput, monthsInput, startInput];

    inputs.forEach((inp, i) => {
      inp.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();

          const isOptional = inp.hasAttribute('data-optional');
          const hasValue = inp.value && inp.value.trim().length > 0;

          if (hasValue || isOptional) {
            const nextInput = inputs[i + 1];
            if (nextInput) {
              nextInput.focus();
            } else {
              calcButton.click();
            }
          } else {
            // Optionally, give feedback (e.g., red border)
            inp.focus();
          }
        }
      });
    });

    //input validation
    const years = loanDetails.loanTermYears;
    const months = loanDetails.loanTermMonths;

    const onlyOneTerm =
      (years && years > 0 && (!months || months === 0)) ||
      (months && months > 0 && (!years || years === 0));

    const isValidInput =
      !isNaN(loanDetails.amount) &&
      loanDetails.amount >= 500 &&
      !isNaN(loanDetails.interestRate) &&
      loanDetails.interestRate > 0 &&
      onlyOneTerm && //ensures user enters only one field
      loanDetails.startDate !== '';

    if (!isValidInput) {
      console.warn('Please fill exactly one term field and valid numbers');
      return;
    }

    const loanResult = calculateLoan(loanDetails);
    if (!loanResult) return;
    const formatStartDate = dayjs(loanResult.start);
    const formatLastDate = dayjs(loanResult.last).format('MMMM D, YYYY');
    console.log(loanResult);
    console.log(formatStartDate.format('MMMM D, YYYY'));
    console.log(formatLastDate);

    // Display loanDetails in a chart
    myChart?.destroy();
    myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Loan Payment',
            data: [loanResult.principal, loanResult.totalInterest],
            borderWidth: 1,
            backgroundColor: ['rgb(31, 52, 243)', 'rgb(247, 47, 91)'],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        maintainAspectRatio: false,
      },
    });

    // Displays the chart details in figures for UX
    (
      document.querySelector('.js-loan-chart-amount') as HTMLDivElement
    ).innerHTML = `<p>Loan Amount</p><span>₦${numberWithCommas(loanResult.principal)}</span>`;
    (
      document.querySelector('.js-total-chart-interest') as HTMLDivElement
    ).innerHTML = `<p>Total Interest</p><span>₦${numberWithCommas(
      loanResult.totalInterest
    )}</span>`;
    (
      document.querySelector('.js-total-chart-payment') as HTMLDivElement
    ).innerHTML = `<p>Total Payment</p><span>₦${numberWithCommas(loanResult.totalPayment)}</span>`;

    // Clear inputs after each calculation
    inputs.forEach((inp) => (inp.value = ''));

    // Summary and Schedule table
    summary.length = 0;
    schedule.length = 0;

    summary.push({
      monthlyPayment: +loanResult.monthlyPayment.toFixed(2),
      totalPayment: +loanResult.totalInterest.toFixed(2),
      principal: +loanResult.principal.toFixed(2),
      totalInterest: +loanResult.totalInterest.toFixed(2),
      installmentNum: 12,
      interestRate: +loanResult.interest.toFixed(2),
      calculatedYears: loanResult.calculatedYears,
      calculatedMonths: loanResult.calculatedMonths,
      start: loanResult.start,
      last: loanResult.last,
    });

    const totalMonths =
      loanResult.calculatedYears > 0
        ? loanResult.calculatedYears * 12
        : loanResult.calculatedMonths;

    let balance = loanResult.principal;

    for (let i = 0; i < totalMonths; i++) {
      const currentDate = formatStartDate.add(i, 'month');
      const interest = balance * loanResult.calculatedInterest;
      const principal = loanResult.monthlyPayment - interest;
      balance = balance - principal;

      schedule.push({
        date: currentDate.toISOString(),
        monthlyPayment: +loanResult.monthlyPayment.toFixed(2),
        interest: +interest.toFixed(2),
        principal: +principal.toFixed(2),
        balance: +balance.toFixed(2) > 0 ? +balance.toFixed(2) : 0,
      });
    }

    console.log('Schedule:', schedule);
    console.log('Summary:', summary);

    renderSummaryTable();
    renderScheduleTable();
  });
};

// Render the data on the page
document.addEventListener('DOMContentLoaded', () => {
  // Render content first
  renderForm();
  renderSummaryTable();
  renderScheduleTable();

  // Query elements after they’ve been injected
  const formElement = document.querySelector('.js-form-placeholder form') as HTMLElement;
  const summaryTable = document.querySelector('.js-summary-placeholder div') as HTMLElement;
  const scheduleTable = document.querySelector('.js-schedule-placeholder div') as HTMLElement;

  const loanSummaryNav = document.querySelector('.js-loan-summary-nav') as HTMLLIElement;
  const calculateLoanNav = document.querySelector('.js-calculate-nav') as HTMLLIElement;
  const loanScheduleNav = document.querySelector('.js-loan-schedule-nav') as HTMLLIElement;

  // Set up navigation logic
  toggleNavLink(loanSummaryNav, summaryTable, formElement, scheduleTable);
  toggleNavLink(calculateLoanNav, formElement, summaryTable, scheduleTable);
  toggleNavLink(loanScheduleNav, scheduleTable, formElement, summaryTable);

  const canvas = document.getElementById('myChart') as HTMLCanvasElement;

  inputPreprocessing(canvas);
});
