"use strict";
// DOM
// input elements
const loanAmountUserInput = document.querySelector('.js-loan-amount');
const loanInterestUserInput = document.querySelector('.js-loan-interest');
const loanDurationUserInput = document.querySelector('.js-loan-duration');
const loanStartDateInput = document.querySelector('.js-loan-start-date');
// button element
const calculateLoanButton = document.querySelector('.js-calculate-loan');
if (!loanAmountUserInput || !loanInterestUserInput || !loanDurationUserInput || !calculateLoanButton || !loanStartDateInput) {
    throw new Error("One or more input elements are missing in the DOM.");
}
//console.log(loanDetails.amount);
// preprocessing the data functionality
const calculateLoan = ({ amount, interestRate, years }) => {
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
    };
};
const renderPage = () => {
    calculateLoanButton.addEventListener('click', (e) => {
        e.preventDefault();
        // define loan details object for user inputs
        const loanDetails = {
            amount: parseFloat(loanAmountUserInput.value),
            interestRate: parseFloat(loanInterestUserInput.value),
            years: parseInt(loanDurationUserInput.value, 10),
            startDate: parseInt(loanStartDateInput.value)
        };
        //input validation
        const isValidInput = !isNaN(loanDetails.amount) && loanDetails.amount >= 500 &&
            !isNaN(loanDetails.interestRate) && loanDetails.interestRate > 0 &&
            !isNaN(loanDetails.years) && loanDetails.years > 0 &&
            !isNaN(loanDetails.startDate);
        if (isValidInput) {
            console.log(calculateLoan(loanDetails));
        }
        else {
            if (!(e instanceof MouseEvent)) {
                return;
            }
            else {
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
const calculatePaymentDates = (startDateStr, years) => {
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
const loanInputs = [
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
            }
            else {
                calculateLoanButton.focus();
            }
        }
    });
});
renderPage();
