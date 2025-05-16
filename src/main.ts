import { Chart } from 'chart.js/auto';

let myChart: Chart | null = null;

// DOM
// input elements
const amountInput = document.querySelector(
  '.js-loan-amount'
) as HTMLInputElement;
const interestInput = document.querySelector(
  '.js-loan-interest'
) as HTMLInputElement;
const loanTermYearsInput = document.querySelector(
  '.js-loan-term-years'
) as HTMLInputElement;
const loanTermMonthsInput = document.querySelector(
  '.js-loan-term-monthly'
) as HTMLInputElement;
const startDateInput = document.querySelector(
  '.js-loan-start-date'
) as HTMLInputElement;

// button element
const calculateButton = document.querySelector(
  '.js-calculate-loan'
) as HTMLInputElement;

// Nav click events
const formElement = document.querySelector(
  '.loan-details-wrapper form'
) as HTMLFormElement;
const loanSummaryNav = document.querySelector(
  '.js-loan-summary-nav'
) as HTMLLIElement;
const calculateLoanNav = document.querySelector(
  '.js-calculate-nav'
) as HTMLLIElement;
const loanScheduleNav = document.querySelector(
  '.js-loan-schedule-nav'
) as HTMLLIElement;
const summaryTable = document.querySelector(
  '.loan-summary-table'
) as HTMLTableElement;
const scheduleTable = document.querySelector(
  '.loan-schedule-table'
) as HTMLTableElement;

// Type guard for missing elements
if (
  !amountInput ||
  !interestInput ||
  !loanTermYearsInput ||
  !loanTermMonthsInput ||
  !calculateButton ||
  !startDateInput
) {
  throw new Error('One or more input elements are missing in the DOM.');
}

// type aliases
type LoanDetails = {
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
  calculatedInterest: number;
  start: Date;
  last: Date;
};

// Utility function: formats figures with commas
/** remove every comma before calculations */
const stripCommas = (val: string) => val.replace(/,/g, '');

function numberWithCommas(x: number | string) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/* ---------- live formatting ---------- */
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
  amountInput.setSelectionRange(
    amountInput.value.length,
    amountInput.value.length
  );
});

/* Assure perfect formatting when user leaves field */
amountInput.addEventListener('blur', () => {
  amountInput.value = numberWithCommas(amountInput.value);
}); // ChatGPT code

const toggleNavLink = (
  clickEvent: HTMLElement,
  value: HTMLElement,
  element1: HTMLElement,
  element2: HTMLElement
): void => {
  if (!clickEvent) return;

  clickEvent.addEventListener('click', () => {
    if (!value) {
      console.error('table element not found.');
      return;
    }

    if (
      getComputedStyle(element1).display === 'block' ||
      getComputedStyle(element2).display === 'block'
    ) {
      element1.style.display = 'none';
      element2.style.display = 'none';
      value.style.display = 'block';
    }
  });
};

// Loan calculation functionality
const calculateLoan = ({
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
  const monthly =
    (principal * interestGrowth * calculatedInterest) / (interestGrowth - 1);

  const total = monthly * calculatedYears;
  const interest = total - principal;

  return {
    monthlyPayment: parseFloat(monthly.toFixed(2)),
    monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
    totalInterest: parseFloat(interest.toFixed(2)),
    totalPayment: parseFloat(total.toFixed(2)),
    principal,
    calculatedYears,
    calculatedInterest,
    start: loanStart,
    last: lastPayment,
  };
};

//Preprocessing the user input functionality
const inputPreprocessing = (ctx: HTMLCanvasElement) => {
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
      const loanResult = calculateLoan(loanDetails);

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
        const loanPrincipal = document.querySelector(
          '.js-loan-chart-amount'
        ) as HTMLDivElement;
        loanPrincipal.innerHTML = `
        <p>Loan Amount</p>
        <span style="color: rgb(31, 52, 243); font-weight: bolder;">₦${numberWithCommas(
          loanResult.principal
        )}</span>
        `;

        const totalInterest = document.querySelector(
          '.js-total-chart-interest'
        ) as HTMLDivElement;
        totalInterest.innerHTML = `
        <p>Total Interest Payable</p>
        <span style="color:rgb(247, 47, 91); font-weight: bolder;">₦${numberWithCommas(
          loanResult.totalInterest
        )}</span>
        `;

        const totalPayment = document.querySelector(
          '.js-total-chart-payment'
        ) as HTMLDivElement;
        totalPayment.innerHTML = `
        <p>Total Payment</p>
        <span style="font-weight: bolder;">₦${numberWithCommas(
          loanResult.totalPayment
        )}</span>
        `;
      }
    } else {
      if (!(e instanceof MouseEvent)) {
        return;
      } else {
        console.log('Invalid Input');
      }
    }

    // display start date and end date

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
  });
};

// Render the data on the page

document.addEventListener('DOMContentLoaded', () => {
  toggleNavLink(loanSummaryNav, summaryTable, formElement, scheduleTable);
  toggleNavLink(calculateLoanNav, formElement, summaryTable, scheduleTable);
  toggleNavLink(loanScheduleNav, scheduleTable, formElement, summaryTable);

  inputPreprocessing(document.getElementById('myChart') as HTMLCanvasElement);
});
