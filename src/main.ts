// DOM
// input elements
const loanAmountUserInput = document.querySelector('.js-loan-amount') as HTMLInputElement;
const loanInterestUserInput = document.querySelector('.js-loan-interest') as HTMLInputElement;
const loanDurationUserInput = document.querySelector('.js-loan-duration') as HTMLInputElement;

// button element
const calculateLoanButton = document.querySelector('.js-calculate-loan') as HTMLButtonElement;

if (!loanAmountUserInput || !loanInterestUserInput || !loanDurationUserInput || !calculateLoanButton) {
  throw new Error("One or more input elements are missing in the DOM.");
}

// string literals type definition
type Loan = 'amount' | 'interestRate' | 'years';
type Payment = 'monthlyPayment' | 'monthlyInterest' | 'totalInterest' | 'totalPayment';

// map through each item of the array 
type LoanDetails = {
  [L in Loan]: number
}

type PaymentDetails = {
  [P in Payment]: number /* | string */
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
    monthlyPayment: Number(monthly.toFixed(2)),
    monthlyInterest: Number(monthlyInterest.toFixed(2)),
    totalInterest: Number(interest.toFixed(2)),
    totalPayment: Number(total.toFixed(2))
  }
}

const renderPage = (): void => {
  calculateLoanButton.addEventListener('click', (e) => {
    e.preventDefault();

    // define loan details object for user inputs
    const loanDetails: LoanDetails = {
      amount: Number(loanAmountUserInput.value),
      interestRate: Number(loanInterestUserInput.value),
      years: Number(loanDurationUserInput.value)
    }

    const isValidInput =
      isNaN(loanDetails.amount) && loanDetails.amount >= 500 &&
      isNaN(loanDetails.interestRate) && loanDetails.interestRate > 0 &&
      isNaN(loanDetails.years) && loanDetails.years > 0

    if(isValidInput) {
      console.log(calculateLoan(loanDetails));
    } else {
      console.log('Invalid Input');
    }
  });
};

renderPage();

