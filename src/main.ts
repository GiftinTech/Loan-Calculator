import { Chart } from 'chart.js/auto';

let myChart: Chart | null = null;

// DOM
// input elements
const amountInput = document.querySelector('.js-loan-amount') as HTMLInputElement;
const interestInput = document.querySelector('.js-loan-interest') as HTMLInputElement;
const loanTermYearsInput = document.querySelector('.js-loan-term-years') as HTMLInputElement;
const loanTermMonthsInput = document.querySelector('.js-loan-term-month') as HTMLInputElement;
const startDateInput = document.querySelector('.js-loan-start-date') as HTMLInputElement;

const formPlaceholder = document.querySelector('.js-form-placeholder') as HTMLDivElement;
const summaryPlaceholder = document.querySelector('.js-summary-placeholder') as HTMLDivElement;
const schedulePlaceholder = document.querySelector('.js-schedule-placeholder') as HTMLDivElement;

// button element
const calculateButton = document.querySelector('.js-calculate-loan') as HTMLInputElement;

// Type guard for missing elements
if (
  !amountInput ||
  !interestInput ||
  !loanTermYearsInput ||
  !loanTermMonthsInput ||
  !calculateButton ||
  !startDateInput
) {
  // throw new Error('One or more input elements are missing in the DOM.');
  renderForm();
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

/* ---------- live formatting ---------- */
export function initLoanCalculatorDOM() {
  if (!amountInput) return;

  amountInput.addEventListener('input', () => {
    // caret position bookkeeping so typing feels natural
    const start = amountInput.selectionStart ?? 0;

    // raw numeric string without commas
    const raw = stripCommas(amountInput.value);

    // bail if user deleted everything
    if (raw === '') {
      amountInput.value = '';
      return;
    }

    // format and re-set the value
    amountInput.value = numberWithCommas(raw);

    /* restore caret near the end; optional: smarter caret logic */
    amountInput.setSelectionRange(amountInput.value.length, amountInput.value.length);
  });

  /* Assure perfect formatting when user leaves field */
  amountInput.addEventListener('blur', () => {
    amountInput.value = numberWithCommas(amountInput.value);
  }); // ChatGPT code
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLoanCalculatorDOM();
  });
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

//Preprocessing the user input functionality
export const inputPreprocessing = (ctx: HTMLCanvasElement) => {
  calculateButton.addEventListener('click', (e) => {
    e.preventDefault();

    // define loan details object for user inputs
    const loanDetails: LoanDetails = {
      amount: parseFloat(stripCommas(amountInput.value)),
      interestRate: parseFloat(interestInput.value),
      loanTermYears: parseInt(loanTermYearsInput.value, 10),
      loanTermMonths: parseInt(loanTermYearsInput.value, 10),
      startDate: startDateInput.value,
    };

    // store the calculateLoan(loanDetails) output in loanResult
    const loanResult = calculateLoan(loanDetails);

    //input validation
    const isValidInput =
      !isNaN(loanDetails.amount) &&
      loanDetails.amount >= 500 &&
      !isNaN(loanDetails.interestRate) &&
      loanDetails.interestRate > 0 &&
      loanDetails.loanTermYears !== undefined &&
      !isNaN(loanDetails.loanTermYears) &&
      loanDetails.loanTermYears > 0 &&
      loanDetails.loanTermMonths !== undefined &&
      !isNaN(loanDetails.loanTermMonths) &&
      loanDetails.loanTermMonths > 0 &&
      loanDetails.startDate !== '';

    if (isValidInput) {
      // Destroy previous chart before creating a new one
      if (myChart) {
        myChart.destroy();
      }

      // Display loan details in a chart
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
      if (myChart) {
        const loanPrincipal = document.querySelector('.js-loan-chart-amount') as HTMLDivElement;
        loanPrincipal.innerHTML = `
        <p>Loan Amount</p>
        <span style="color: rgb(31, 52, 243); font-weight: bolder;">₦${numberWithCommas(
          loanResult.principal
        )}</span>
        `;

        const totalInterest = document.querySelector('.js-total-chart-interest') as HTMLDivElement;
        totalInterest.innerHTML = `
        <p>Total Interest Payable</p>
        <span style="color:rgb(247, 47, 91); font-weight: bolder;">₦${numberWithCommas(
          loanResult.totalInterest
        )}</span>
        `;

        const totalPayment = document.querySelector('.js-total-chart-payment') as HTMLDivElement;
        totalPayment.innerHTML = `
        <p>Total Payment</p>
        <span style="font-weight: bolder;">₦${numberWithCommas(loanResult.totalPayment)}</span>
        `;
      }
    } else {
      if (!(e instanceof MouseEvent)) {
        return;
      } else {
        console.log('Invalid Input');
      }
    }

    // display calculateLoan(LoanDetails) output
    console.log(loanResult);

    // display start date and end date
    console.log(loanResult.start);
    console.log(loanResult.last);

    // Navigate the input with keyboard
    const loanInputs: HTMLInputElement[] = [
      amountInput,
      interestInput,
      loanTermYearsInput,
      loanTermMonthsInput,
      startDateInput,
    ];

    // use enter key to navigate only if there is a value in the input
    loanInputs.forEach((input, index) => {
      input.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' && this.value) {
          e.preventDefault();

          const nextInput = loanInputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          } else if (calculateButton) {
            calculateButton.focus();
            calculateButton.style.fontWeight = 'bold';
            calculateButton.style.backgroundColor = 'var(--PRIMARY-HOVER)';
            calculateButton.style.borderColor = 'var(--BORDER-HOVER)';
          }
        }
      });
    });

    // clear input fields when calculate button is clicked
    amountInput.value = '';
    interestInput.value = '';
    loanTermYearsInput.value = '';
    loanTermMonthsInput.value = '';
    startDateInput.value = '';

    //call renderForm();
  });
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
          class="loan-input js-loan-term-years"
          placeholder="Enter loan term in"
        />
      </div>

      <label> Loan Term <span class="per-term">per/month</span></label>
      <div class="term-wrapper">
        <span class="years-symbol">month(s)</span>
        <input
          type="number"
          class="loan-input js-loan-term-month"
          placeholder="Enter loan term in"
        />
      </div>

      <!-- **** Ignore the commented blocks, hehe **** -->
      <!-- <label> Loan Term </label>
      <select name="loan-term" class="loan-term js-loan-term">
        <option value="monthly" selected>Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="semi-annually">Semi-Annually</option>
        <option value="yearly">Annually</option>
      </select> -->

      <!--      <div>
        <label for="loan-term"> Loan Term </label>
        <input
          type="text"
          name="loan-term"
          id="loan-term"
          list="loan-term-list"
        />
        <datalist id="loan-term-list">
          <option value="Monthly"></option>
          <option value="Quarterly"></option>
          <option value="Semi-Annually"></option>
          <option value="Yearly"></option>
        </datalist>
      </div> -->

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

// Render the data on the page
document.addEventListener('DOMContentLoaded', () => {
  // Step 1: Render content first
  renderForm();
  renderSummaryTable();
  renderScheduleTable();

  // Step 2: Requery elements *after* they’ve been injected
  const formElement = document.querySelector('.js-form-placeholder form') as HTMLElement;
  const summaryTable = document.querySelector('.js-summary-placeholder div') as HTMLElement;
  const scheduleTable = document.querySelector('.js-schedule-placeholder div') as HTMLElement;

  const loanSummaryNav = document.querySelector('.js-loan-summary-nav') as HTMLLIElement;
  const calculateLoanNav = document.querySelector('.js-calculate-nav') as HTMLLIElement;
  const loanScheduleNav = document.querySelector('.js-loan-schedule-nav') as HTMLLIElement;

  // Step 3: Set up navigation logic
  toggleNavLink(loanSummaryNav, summaryTable, formElement, scheduleTable);
  toggleNavLink(calculateLoanNav, formElement, summaryTable, scheduleTable);
  toggleNavLink(loanScheduleNav, scheduleTable, formElement, summaryTable);

  inputPreprocessing(document.getElementById('myChart') as HTMLCanvasElement);
});
