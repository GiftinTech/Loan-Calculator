# 💰 Simple Loan Calculator with Amortisation Chart

This is a simple web-based loan calculator built with **HTML**, **CSS**, **JavaScript** and **TypeScript**. It helps users estimate monthly repayments, total interest and payment schedules for various currencies, and visualises the **amortisation schedule**—showing how your payments are split between **interest** and **principal** over time.

---

## ✨ Features

- **Multi-currency Support:**  
  Supports Naira (₦), US Dollar ($), Euro (€), and British Pound (£). User’s last selected currency is remembered.

- **Loan Calculation:**  
  Calculates monthly repayment, total payment, total interest, and generates an amortisation schedule.

- **Flexible Loan Term Input:**  
  Users can specify loan term in either years or months (not both). Real-time validation ensures only one is filled.

- **Real-time Validation:**

  - Loan amount must be a number and at least 500.
  - Interest rate must be a positive number.
  - Loan term validation with error messages and red border highlights.
  - Start date is required.

- **Interactive UI:**

  - Keyboard navigation between fields.
  - Responsive design with horizontal scroll for tables on small screens.
  - Navigation tabs for Calculate, Loan Summary, and Loan Schedule.

- **Charts & Visuals:**

  - Doughnut chart visualizes principal vs. interest.
  - Chart details update with selected currency.

- **Data Persistence:**

  - Last calculation (summary, schedule, chart) is saved in localStorage and restored on reload.
  - User’s currency choice is saved and restored.

- **CSV Export:**
  - Download loan summary and amortisation schedule as CSV files.

---

## Usage

1. **Select Currency:**  
   Choose your preferred currency from the dropdown.

2. **Enter Loan Details:**

   - Loan Amount (min 500)
   - Annual Interest Rate (%)
   - Loan Term (years **or** months)
   - Start Date

3. **Calculate:**  
   Click "Calculate" to view results.

4. **View Results:**

   - **Loan Summary:** See payment breakdown and important dates.
   - **Loan Schedule:** View amortisation table (with horizontal scroll on mobile).
   - **Chart:** Visual breakdown of principal vs. interest.

5. **Export:**  
   Download summary or schedule as CSV.

---

## 🛠 Tech Stack

- **TypeScript**
- **Vite & Vitest**
- **Chart.js**
- **Day.js**
- **HTML5 & CSS3**

---

## 📁 Project Structure

```

Loan Calculator App/
├── node_modules
├── public/
│   └── favicon.ico
├── src/
│   ├── main.ts
│   └── style.css
├── tests/
│   └── loanCalculator.test.ts
├── .gitignore
├── index.html
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts

```

---

## Improvements & Future Features

- Add more currencies and currency formatting
- Add dark mode/theme switcher
- Support for extra payments or lump sums
- Improved accessibility and mobile UX
- More detailed error messages and tooltips

---

## 🖼 Preview

![Loan Calculator Screenshot](screenshot.png) <!-- Add your screenshot here -->

---

## 🚀 Live Demo

[🔗 View Live Project](https://loan-calculator-five-zeta.vercel.app/) <!-- Replace with your link -->

---

## 🧪 How to Use Locally

```bash
git clone https://github.com/GiftinTech/loan-calculator.git
cd "Loan Calculator App"
npm install
npm run dev
```

---

## 🤝 Contributing

_This project is a work in progress. Contributions and suggestions are welcome!_ Feel free to fork and submit a PR if you have suggestions or improvements.

---

## 📜 License

MIT

---

## 👨‍💻 Author

Built by GiftinTech — Frontend Developer and an aspiring full-stack developer.
