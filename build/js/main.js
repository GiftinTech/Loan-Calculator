"use strict";
// DOM
// input elements
const loanAmountUserInput = document.querySelector('.js-loan-amount');
const loanInterestUserInput = document.querySelector('.js-loan-interest');
const loanDurationUserInput = document.querySelector('.js-loan-duration');
// button element
const calculateLoanButton = document.querySelector('.js-calculate-loan');
//console.log(loanDetails.amount);
// preprocessing the data functionality
const calculateLoan = ({ amount, interestRate, years }) => {
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
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
        totalInterest: Number(interest.toFixed(2)),
        totalPayment: Number(total.toFixed(2))
    };
};
const renderPage = () => {
    calculateLoanButton.addEventListener('click', (e) => {
        e.preventDefault();
        // define loan details object for user inputs
        const loanDetails = {
            amount: Number(loanAmountUserInput.value),
            interestRate: Number(loanInterestUserInput.value),
            years: Number(loanDurationUserInput.value)
        };
        if (loanDetails.amount >= 500 || !loanDetails.amount === null &&
            loanDetails.interestRate > 0 || !loanDetails.interestRate === null &&
            loanDetails.years > 0 || !loanDetails.years === null) {
            console.log(calculateLoan({
                amount: loanDetails.amount,
                interestRate: loanDetails.interestRate,
                years: loanDetails.years
            }));
        }
        else {
            console.log('Invalid Input');
        }
    });
};
renderPage();
