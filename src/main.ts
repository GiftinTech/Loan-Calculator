import { Chart } from 'chart.js/auto';

let myChart: Chart | null = null;

// DOM

const formPlaceholder = document.querySelector('.js-form-placeholder') as HTMLDivElement;
const summaryPlaceholder = document.querySelector('.js-summary-placeholder') as HTMLDivElement;
const schedulePlaceholder = document.querySelector('.js-schedule-placeholder') as HTMLDivElement;

// button element
const calculateButton = document.querySelector('.js-calculate-loan') as HTMLInputElement;

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
  calculatedYears: number;
  calculatedMonths: number;
  calculatedInterest: number;
  start: Date;
  last: Date;
};

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
  const principal: number = amount;
  const calculatedInterest = interestRate / 100 / 12;
  const calculatedYears = loanTermYears! * 12;

  const calculatedMonths = loanTermMonths! / 12;

  const loanStart = new Date(startDate);

  const firstPayment = new Date(loanStart);
  firstPayment.setMonth(firstPayment.getMonth());

  const lastPayment = new Date(firstPayment);
  lastPayment.setMonth(lastPayment.getMonth() + loanTermYears! * 12);

  const monthlyInterest = calculatedInterest * principal;
  const interestGrowth = Math.pow(1 + calculatedInterest, calculatedYears);
  const monthly = (principal * interestGrowth * calculatedInterest) / (interestGrowth - 1);

  const total = monthly * calculatedYears;
  const interest = total - principal;

  return {
    monthlyPayment: parseFloat(monthly.toFixed(2)),
    monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
    totalInterest: parseFloat(interest.toFixed(2)),
    totalPayment: parseFloat(total.toFixed(2)),
    principal,
    calculatedYears,
    calculatedMonths,
    calculatedInterest,
    start: loanStart,
    last: lastPayment,
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
      <div class="term-wrapper">
        <span class="years-symbol">year(s)</span>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-years"
          placeholder="Enter loan term in"
        />
      </div>

      <label> Loan Term <span class="per-term">per/month</span></label>
      <div class="term-wrapper">
        <span class="years-symbol">month(s)</span>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-month"
          placeholder="Enter loan term in"
        />
      </div>
      
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
}

function renderSummaryTable() {
  summaryPlaceholder.innerHTML = `
    <div class="loan-summary-table js-summary-table">
      <table>
        <caption>
          Loan Summary Result
        </caption>
        <thead>
          <tr>
            <th colspan="2">Payment Breakdown</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Monthly Repayment</td>
            <td>2400000</td>
          </tr>
          <tr>
            <td>Total Loan Payment</td>
            <td>300000</td>
          </tr>
          <tr>
            <td>Loan Amount</td>
            <td>300000</td>
          </tr>
          <tr>
            <td>Total Interest</td>
            <td>150000</td>
          </tr>
          <tr>
            <td>Number of Installments</td>
            <td>12</td>
          </tr>
          <tr>
            <td>Interest Rate per/anum</td>
            <td>15</td>
          </tr>
          <tr>
            <td>Loan Duration (months)</td>
            <td>150000</td>
          </tr>
          <tr>
            <td>First Payment Date</td>
            <td>May-2025</td>
          </tr>
          <tr>
            <td>Last Payment Date</td>
            <td>June-2026</td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="2" style="text-align: right">
              <em>Download to Excel</em>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function renderScheduleTable() {
  schedulePlaceholder.innerHTML = `
    <div class="loan-schedule-table js-loan-schedule-table">
      <div class="estimated-payoff">
        <h1>Estimated payoff date</h1>
        <p>May 16, 2027</p>
      </div>
      <table>
        <caption>
          Amortisation Schedule
        </caption>
        <thead>
          <tr class="schedule-th">
            <th>Payment Date</th>
            <th>Monthly Repayment</th>
            <th>Interest</th>
            <th>Current Balance</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr>
            <td>1/12/2025</td>
            <td>4000</td>
            <td>500</td>
            <td>15000</td>
          </tr>
          <tr class="schedule-th">
            <th>Payment Date</th>
            <th>Monthly Repayment</th>
            <th>Interest</th>
            <th>Current Balance</th>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="4" style="text-align: right">
              <em>Download to Excel</em>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    `;
}

//Preprocessing the user input functionality
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
    const hasY = loanDetails.loanTermYears && loanDetails.loanTermYears > 0;
    const hasM = loanDetails.loanTermMonths && loanDetails.loanTermMonths > 0;
    if (
      isNaN(loanDetails.amount) ||
      loanDetails.amount < 500 ||
      isNaN(loanDetails.interestRate) ||
      loanDetails.interestRate <= 0 ||
      (!hasY && !hasM) ||
      (hasY && hasM) ||
      !loanDetails.startDate
    ) {
      console.warn('Please fill exactly one term field and valid numbers');
      return;
    }

    const loanResult = calculateLoan(loanDetails);

    // Display loanDetails in a chart
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
  });
};

// Render the data on the page
document.addEventListener('DOMContentLoaded', () => {
  // Render content first
  renderForm();
  renderSummaryTable();
  renderScheduleTable();

  // Query elements *after* they’ve been injected
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
