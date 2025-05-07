// DOM
// input elements
const loanAmountUserInput = document.querySelector('.js-loan-amount') as HTMLInputElement;
const loanInterestUserInput = document.querySelector('.js-loan-interest') as HTMLInputElement;
const loanDurationUserInput = document.querySelector('.js-loan-duration') as HTMLInputElement;
const loanStartDateInput = document.querySelector('.js-loan-start-date') as HTMLInputElement;

// button element
const calculateLoanButton = document.querySelector('.js-calculate-loan') as HTMLInputElement

if (!loanAmountUserInput || !loanInterestUserInput || !loanDurationUserInput || !calculateLoanButton || !loanStartDateInput) {
  throw new Error("One or more input elements are missing in the DOM.");
}

// string literals type definition
type Loan = 'amount' | 'interestRate' | 'years' | 'startDate';
/* type Payment = 'monthlyPayment' | 'monthlyInterest' | 'totalInterest' | 'totalPayment'; */

// map through each item of the array 
type LoanDetails = {
  [L in Loan]: number
}

type PaymentDetails = {
  [key: string]: number;
  //[P in Payment]: number 
}

//console.log(loanDetails.amount);

// preprocessing the data functionality
const calculateLoan = ({ amount, interestRate, years }: LoanDetails): PaymentDetails => {
  const principal = amount; 
  const calculatedInterest = interestRate / 100 / 12;
  const calculatedPayment = years * 12;

  const monthlyInterest = calculatedInterest * principal;
  const interestGrowth = Math.pow(1 + calculatedInterest, calculatedPayment);
  const monthly = (principal * interestGrowth * calculatedInterest) / (interestGrowth - 1);

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
  }
}

const renderPage = (): void => {
  calculateLoanButton.addEventListener('click', (e) => {
    e.preventDefault();

    // define loan details object for user inputs
    const loanDetails: LoanDetails = {
      amount: parseFloat(loanAmountUserInput.value),
      interestRate: parseFloat(loanInterestUserInput.value),
      years: parseInt(loanDurationUserInput.value, 10),
      startDate: parseInt(loanStartDateInput.value)
    }

    //input validation
    const isValidInput =
      !isNaN(loanDetails.amount) && loanDetails.amount >= 500 &&
      !isNaN(loanDetails.interestRate) && loanDetails.interestRate > 0 &&
      !isNaN(loanDetails.years) && loanDetails.years > 0 &&
      !isNaN(loanDetails.startDate);

    if(isValidInput) {
      console.log(calculateLoan(loanDetails));
    } else {
      if (!(e instanceof MouseEvent)) {
        return;
      } else {
        console.log('Invalid Input');
      }
    }

    const years = parseInt(loanDurationUserInput.value, 10);
    const startDateStr = loanStartDateInput.value;

    const { first, last } = calculatePaymentDates(startDateStr, years);
    console.log('First Payment:', first.toDateString());
    console.log('Last Payment:', last.toDateString());
  });
};

const calculatePaymentDates = (startDateStr: string, years: number): { first: Date, last: Date } => {
  const startDate = new Date(startDateStr);

  const firstPayment = new Date(startDate);
  firstPayment.setMonth(firstPayment.getMonth());

  const lastPayment = new Date(firstPayment);
  lastPayment.setMonth(lastPayment.getMonth() + (years * 12));

  return {
    first: firstPayment,
    last: lastPayment
  };
};

const loanInputs: HTMLInputElement[] = [
  loanAmountUserInput,
  loanInterestUserInput,
  loanDurationUserInput
];

loanInputs.forEach((input, index) => {
  input.addEventListener('keyup', function (e) {  
    if (e.key === 'Enter' && this.value) {
      e.preventDefault();

      const nextInput = loanInputs[index + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        calculateLoanButton.focus()
      }
    }
  });
});

renderPage();