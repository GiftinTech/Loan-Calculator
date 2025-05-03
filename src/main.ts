type Loan = 'amount' | 'interestRate' | 'years';
type Payment = 'monthlyPayment' | 'monthlyInterest' | 'totalInterest' | 'totalPayment';

type LoanDetails = {
  [L in Loan]: number
}

type paymentDetails = {
  [P in Payment]: number /* | string */
}

const calculateLoan = ({ amount, interestRate, years }: LoanDetails): paymentDetails => {
  const principal = amount; 
  const calculatedInterest = interestRate / 100 / 12;
  const calculatedPayment = years * 12;

  const monthlyInterest = calculatedInterest * principal;
  const interestGrowth = (1 + calculatedInterest) ** calculatedPayment;
  const monthly = (principal * interestGrowth * calculatedInterest) / (interestGrowth - 1);

  const total = monthly * calculatedPayment;
  const interest = total - principal;

  return {
    monthlyPayment: Number(monthly.toFixed(2)),
    monthlyInterest: Number(monthlyInterest.toFixed()),
    totalInterest: Number(interest.toFixed(2)),
    totalPayment: Number(total.toFixed(2))
  }
}

const renderPage = (value: number) => {
  let userInput = value

  if(userInput >= 500 || !userInput === null) {
    console.log(calculateLoan({
      amount: value,
      interestRate: 12,
      years: 1
    }));
  } else {
    console.log('Invalid Input');
  }
}

renderPage(500)

