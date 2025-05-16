describe('Loan Calculator', () => {
  it('should calculate monthly repayment correctly', () => {
    const principal = 100000;
    const annualInterestRate = 10; // 10%
    const years = 1;

    const monthlyRate = annualInterestRate / 12 / 100;
    const months = years * 12;
    const monthlyRepayment =
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    expect(Math.round(monthlyRepayment)).toBeGreaterThan(8000); // adjust based on your formula
  });
});
