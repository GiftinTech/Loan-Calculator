import { Chart } from 'chart.js/auto';

let myChart;

// DOM
// input elements
const loanAmountUserInput = document.querySelector(
  '.js-loan-amount'
) as HTMLInputElement;
const loanInterestUserInput = document.querySelector(
  '.js-loan-interest'
) as HTMLInputElement;
const loanDurationUserInput = document.querySelector(
  '.js-loan-duration'
) as HTMLInputElement;
const loanStartDateInput = document.querySelector(
  '.js-loan-start-date'
) as HTMLInputElement;

// button element
const calculateLoanButton = document.querySelector(
  '.js-calculate-loan'
) as HTMLInputElement;

if (
  !loanAmountUserInput ||
  !loanInterestUserInput ||
  !loanDurationUserInput ||
  !calculateLoanButton ||
  !loanStartDateInput
) {
  throw new Error('One or more input elements are missing in the DOM.');
}

type LoanDetails = {
  amount: number;
  interestRate: number;
  years: number;
  startDate: string;
};

type PaymentDetails = {
  [key: string]: number | Date;
};

//console.log(loanDetails.amount);

// preprocessing the data functionality
const calculateLoan = ({
  amount,
  interestRate,
  years,
}: LoanDetails): PaymentDetails => {
  const principal = amount;
  const calculatedInterest = interestRate / 100 / 12;
  const calculatedPayment = years * 12;

  const monthlyInterest = calculatedInterest * principal;
  const interestGrowth = Math.pow(1 + calculatedInterest, calculatedPayment);
  const monthly =
    (principal * interestGrowth * calculatedInterest) / (interestGrowth - 1);

  const total = monthly * calculatedPayment;
  const interest = total - principal;

  return {
    monthlyPayment: parseFloat(monthly.toFixed(2)),
    monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
    totalInterest: parseFloat(interest.toFixed(2)),
    totalPayment: parseFloat(total.toFixed(2)),
    principal,
    calculatedPayment,
    calculatedInterest,
  };
};

const renderPage = (): void => {
  const ctx = document.getElementById('myChart') as HTMLCanvasElement;
  calculateLoanButton.addEventListener('click', (e) => {
    e.preventDefault();

    // define loan details object for user inputs
    const loanDetails: LoanDetails = {
      amount: parseFloat(loanAmountUserInput.value),
      interestRate: parseFloat(loanInterestUserInput.value),
      years: parseInt(loanDurationUserInput.value, 10),
      startDate: loanStartDateInput.value,
    };

    //input validation
    const isValidInput =
      !isNaN(loanDetails.amount) &&
      loanDetails.amount >= 500 &&
      !isNaN(loanDetails.interestRate) &&
      loanDetails.interestRate > 0 &&
      !isNaN(loanDetails.years) &&
      loanDetails.years > 0 &&
      loanDetails.startDate !== '';

    if (isValidInput) {
      const loanResult = calculateLoan(loanDetails);
      console.log(loanResult);

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
        <p>Loan Amount <span>${String(loanResult.principal)}</span></p>
        `;

        const totalInterest = document.querySelector(
          '.js-total-chart-interest'
        ) as HTMLDivElement;
        totalInterest.innerHTML = `
        <p>Total Interest Payable <span>${String(
          loanResult.totalInterest
        )}</span></p>
        `;

        const totalPayment = document.querySelector(
          '.js-total-chart-payment'
        ) as HTMLDivElement;
        totalPayment.innerHTML = `
        <p>Total Payment <span>${String(loanResult.totalPayment)}</span></p>
        `;
      }
    } else {
      if (!(e instanceof MouseEvent)) {
        return;
      } else {
        console.log('Invalid Input');
      }
    }

    const years = parseInt(loanDurationUserInput.value, 10);
    const startDateStr = loanStartDateInput.value;

    const calculatePaymentDates = (
      startDateStr: string,
      years: number
    ): PaymentDetails => {
      const startDate = new Date(startDateStr);

      const firstPayment = new Date(startDate);
      firstPayment.setMonth(firstPayment.getMonth());

      const lastPayment = new Date(firstPayment);
      lastPayment.setMonth(lastPayment.getMonth() + years * 12);

      return {
        first: firstPayment,
        last: lastPayment,
      };
    };

    const { first, last } = calculatePaymentDates(startDateStr, years);
    console.log('First Payment:', first);
    console.log('Last Payment:', last);

    // Navigate the input with keyboard
    const loanInputs: HTMLInputElement[] = [
      loanAmountUserInput,
      loanInterestUserInput,
      loanDurationUserInput,
      loanStartDateInput,
    ];

    // use enter key to navigate only if there is a value in the input
    loanInputs.forEach((input, index) => {
      input.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' && this.value) {
          e.preventDefault();

          const nextInput = loanInputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          } else if (calculateLoanButton) {
            calculateLoanButton.focus();
            calculateLoanButton.style.fontWeight = 'bold';
            calculateLoanButton.style.backgroundColor = 'var(--PRIMARY-HOVER)';
            calculateLoanButton.style.borderColor = 'var(--BORDER-HOVER)';
          }
        }
      });
    });
  });
};

renderPage();
