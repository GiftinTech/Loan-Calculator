import { Chart } from 'chart.js/auto';
import dayjs from 'dayjs';

let myChart: Chart | null = null;

// DOM

const formPlaceholder = document.querySelector('.js-form-placeholder') as HTMLDivElement;
const summaryPlaceholder = document.querySelector('.js-summary-placeholder') as HTMLDivElement;
const schedulePlaceholder = document.querySelector('.js-schedule-placeholder') as HTMLDivElement;

//  Utility: convert a (years, months) pair into totalMonths  ⇢ number of payment periods yearsPart ⇢ whole-years portion monthsPart ⇢ leftover months

function normaliseTerm(years: number | undefined, months: number | undefined) {
  const y = years ?? 0;
  const m = months ?? 0;

  // if user typed only months, y will be 0
  // if user typed only years,  m will be 0
  const totalMonths = y * 12 + m;

  // derive “X years Y months” for display
  const yearsPart = Math.floor(totalMonths / 12);
  const monthsPart = totalMonths % 12;

  return { totalMonths, yearsPart, monthsPart };
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
  interest: number;
  calculatedYears: number;
  calculatedMonths: number;
  calculatedInterest: number;
  start: Date;
  last: Date;
};

interface SummaryEntry {
  monthlyPayment: number;
  totalPayment: number;
  principal: number;
  totalInterest: number;
  installmentNum: number;
  interestRate: number;
  calculatedYears: number;
  calculatedMonths: number;
  start: Date;
  last: Date;
}
const summary: SummaryEntry[] = [];

interface ScheduleEntry {
  date: string;
  monthlyPayment: number;
  interest: number;
  principal: number;
  balance: number;
}
const schedule: ScheduleEntry[] = [];

// Utility function:
// Currency selection
const currencySymbols: Record<string, string> = {
  NGN: '&#8358;', // Naira
  USD: '&#36;', // Dollar
  EUR: '&euro;', // Euro
  GBP: '&pound;', // Pound
};

// Currency converter
const currencySelect = document.getElementById('currency-select') as HTMLSelectElement;

let currentCurrency = 'NGN'; // Default

currencySelect?.addEventListener('change', (e) => {
  currentCurrency = (e.target as HTMLSelectElement).value;
  // Save currency choice to localStorage
  localStorage.setItem('selected_currency', currentCurrency);

  // Re-render all UI sections that use the currency symbol
  renderForm();
  renderSummaryTable();
  renderScheduleTable();

  // Re-query and re-attach nav logic after render
  const formElement = document.querySelector('.js-form-placeholder form') as HTMLElement;
  const summaryTable = document.querySelector('.js-summary-placeholder div') as HTMLElement;
  const scheduleTable = document.querySelector('.js-schedule-placeholder div') as HTMLElement;

  const loanSummaryNav = document.querySelector('.js-loan-summary-nav') as HTMLLIElement;
  const calculateLoanNav = document.querySelector('.js-calculate-nav') as HTMLLIElement;
  const loanScheduleNav = document.querySelector('.js-loan-schedule-nav') as HTMLLIElement;

  toggleNavLink(loanSummaryNav, summaryTable, formElement, scheduleTable);
  toggleNavLink(calculateLoanNav, formElement, summaryTable, scheduleTable);
  toggleNavLink(loanScheduleNav, scheduleTable, formElement, summaryTable);

  // Render chart
  const chartDetails = JSON.parse(localStorage.getItem('loan_chart_details') || 'null');
  if (chartDetails && myChart) {
    // Update chart labels and data
    myChart.data.datasets[0].data = [chartDetails.principal, chartDetails.totalInterest];
    myChart.update();

    // Update chart details HTML
    (
      document.querySelector('.js-loan-chart-amount') as HTMLDivElement
    ).innerHTML = `<p>Loan Amount</p><span class="chart-amount-color">${
      currencySymbols[currentCurrency]
    }${numberWithCommas(chartDetails.principal)}</span>`;
    (
      document.querySelector('.js-total-chart-interest') as HTMLDivElement
    ).innerHTML = `<p>Total Interest</p><span class="chart-interest-color">${
      currencySymbols[currentCurrency]
    }${numberWithCommas(chartDetails.totalInterest)}</span>`;
    (
      document.querySelector('.js-total-chart-payment') as HTMLDivElement
    ).innerHTML = `<p>Total Payment</p><span>${currencySymbols[currentCurrency]}${numberWithCommas(
      chartDetails.totalPayment
    )}</span>`;
  }
});

// formats figures with commas
/** remove every comma before calculations */
export const stripCommas = (val: string) => val.replace(/,/g, '');

function numberWithCommas(x: number | string, noDecimals = false) {
  let num = typeof x === 'number' ? x : parseFloat(x.replace(/,/g, ''));
  let formatted = num.toLocaleString(
    undefined,
    noDecimals
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );
  return formatted;
}

function initLiveFormatting(
  el: HTMLInputElement,
  errorElem?: HTMLElement,
  nairaElem?: HTMLElement,
  borderBottom?: HTMLElement
) {
  el.addEventListener('input', (event) => {
    const raw = stripCommas(el.value);
    const isBackspaceorDelete =
      (event as InputEvent).inputType === 'deleteContentBackward' ||
      (event as InputEvent).inputType === 'deleteContentForward';

    // If empty, clear and remove errors
    if (!raw) {
      el.value = '';
      el.classList.remove('invalid');
      if (nairaElem) nairaElem.classList.remove('invalid');
      if (errorElem) errorElem.style.display = 'none';
      if (borderBottom) borderBottom.classList.remove('invalid');
      return;
    }

    // Remove non-digits, update value (never NaN)
    const digitsOnly = raw.replace(/\D+/g, '');
    if (digitsOnly !== raw) {
      el.value = digitsOnly ? numberWithCommas(digitsOnly, true) : '';
      if (!isBackspaceorDelete) {
        el.classList.add('invalid');
        if (nairaElem) nairaElem.classList.add('invalid');
        if (borderBottom) borderBottom.classList.add('invalid');
        if (errorElem) {
          errorElem.textContent = 'Please enter numbers only';
          errorElem.style.display = 'block';
        }
      }
      // After filtering, check if the new value is valid
      if (digitsOnly && parseFloat(digitsOnly) >= 500) {
        el.classList.remove('invalid');
        if (nairaElem) nairaElem.classList.remove('invalid');
        if (errorElem) errorElem.style.display = 'none';
        if (borderBottom) borderBottom.classList.remove('invalid');
      }
      return;
    }

    // Format with commas (valid digits)
    el.value = numberWithCommas(raw, true);

    // Custom validation for minimum amount
    if (parseFloat(raw) < 500) {
      el.classList.add('invalid');
      if (nairaElem) nairaElem.classList.add('invalid');
      if (errorElem) {
        errorElem.textContent = 'Please enter a valid amount (min 500)';
        errorElem.style.display = 'block';
      }
      if (borderBottom) borderBottom.classList.add('invalid');
    } else {
      el.classList.remove('invalid');
      if (nairaElem) nairaElem.classList.remove('invalid');
      if (errorElem) errorElem.style.display = 'none';
      if (borderBottom) borderBottom.classList.remove('invalid');
    }
  });

  // On blur, format with decimals
  el.addEventListener('blur', () => {
    const raw = stripCommas(el.value);
    if (!raw) {
      el.value = '';
      el.classList.remove('invalid');
      if (nairaElem) nairaElem.classList.remove('invalid');
      if (errorElem) errorElem.style.display = 'none';
      if (borderBottom) borderBottom.classList.remove('invalid');
      return;
    }

    if (!/^\d+$/.test(raw) || parseFloat(raw) < 500) {
      return;
    }

    el.value = numberWithCommas(raw, false);
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
  // normalise the loan term
  const { totalMonths, yearsPart, monthsPart } = normaliseTerm(loanTermYears, loanTermMonths);

  if (totalMonths === 0) throw new Error('Loan term must be at least one month');

  // maths
  const principal = amount;
  const interest = interestRate;
  const monthlyRate = interestRate / 100 / 12;
  const interestGrowth = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = (principal * interestGrowth * monthlyRate) / (interestGrowth - 1);

  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principal;
  const firstMonthlyInterest = principal * monthlyRate;

  // dates
  const loanStart = new Date(startDate);
  const loanEnd = new Date(loanStart);
  loanEnd.setMonth(loanEnd.getMonth() + totalMonths);

  // return
  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    monthlyInterest: Number(firstMonthlyInterest.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    principal,
    interest,
    calculatedYears: yearsPart,
    calculatedMonths: monthsPart,
    calculatedInterest: monthlyRate,
    start: loanStart,
    last: loanEnd,
  };
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
    <form name="loanDetailsForm">
      <label class="form-header">Calculate loan interest</label>

      <label for="loan-amount"> Loan Amount </label>
      <div class="amount-wrapper">
        <span class="naira-symbol">${currencySymbols[currentCurrency]}</span>
        <input
          type="text"
          id="loan-amount"
          class="loan-input amount-input js-loan-amount"
          placeholder="Enter loan amount"
          required
        />
      </div>
     <span class="input-error-message" id="amount-error" style="display:none;">Please enter a valid amount (min 500)</span>

      <label for="loan-interest"> Annual Interest Rate </label>
      <div class="interest-wrapper">
        <span class="percentage-symbol">%</span>
        <input
          type="number"
          step="any"
          id="loan-interest"
          class="loan-input js-loan-interest"
          placeholder="Enter loan Interest"
          required
        />
      </div>

      <label> Loan Term <span class="per-term">per/anum</span></label>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-years"
          placeholder="Enter loan term in"
        />

      <div class="optional-term">OR</div>

      <label> Loan Term <span class="per-term">per/month</span></label>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-month"
          placeholder="Enter loan term in"
        />
      <span class="input-error-message" id="term-error" style="display:none;">Please fill only one loan term (years or months)</span>

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
  // --- Auto input rendering logic ---
  const yearsInput = document.querySelector('.js-loan-term-years') as HTMLInputElement;
  const monthsInput = document.querySelector('.js-loan-term-month') as HTMLInputElement;
  const termError = document.getElementById('term-error') as HTMLElement;

  // When months is filled, show equivalent years as placeholder in years input
  monthsInput.addEventListener('input', () => {
    const months = parseInt(monthsInput.value, 10);
    if (!isNaN(months) && months > 0) {
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      yearsInput.placeholder =
        years > 0 && remMonths > 0
          ? `${years} year(s) ${remMonths} month(s)`
          : years > 0
          ? `${years} year(s)`
          : `${remMonths} month(s)`;
    } else {
      yearsInput.placeholder = 'Enter loan term in';
    }
  });

  // When years is filled, show equivalent months as placeholder in months input
  yearsInput.addEventListener('input', () => {
    const years = parseInt(yearsInput.value, 10);
    if (!isNaN(years) && years > 0) {
      monthsInput.placeholder = `${years * 12} month(s)`;
    } else {
      monthsInput.placeholder = 'Enter loan term in';
    }
  });

  // Real-time validation for loan term fields
  function setTermError(show: boolean) {
    if (show) {
      yearsInput.classList.add('invalid');
      monthsInput.classList.add('invalid');
      termError.style.display = 'block';
    } else {
      yearsInput.classList.remove('invalid');
      monthsInput.classList.remove('invalid');
      termError.style.display = 'none';
    }
  }

  function checkTermInputs() {
    const years = parseInt(yearsInput.value, 10);
    const months = parseInt(monthsInput.value, 10);
    setTermError(!isNaN(years) && years > 0 && !isNaN(months) && months > 0);
  }

  yearsInput.addEventListener('input', checkTermInputs);
  monthsInput.addEventListener('input', checkTermInputs);

  const amountInput = document.querySelector('.js-loan-amount') as HTMLInputElement;
  const amountError = document.getElementById('amount-error') as HTMLElement;
  const nairaElem = document.querySelector('.naira-symbol') as HTMLElement;
  initLiveFormatting(amountInput, amountError, nairaElem, amountInput);
}

// Render summary table
function renderSummaryTable() {
  if (!summary.length) {
    summaryPlaceholder.innerHTML = `
      <div class="loan-summary-table js-summary-table">
        <table>
          <caption>Loan Summary Result</caption>
          <thead>
            <tr><th colspan="2">Payment Breakdown</th></tr>
          </thead>
          <tbody id="summary-body">
            <tr>
              <td colspan="2" style="text-align: center; font-style: italic;">
                No summary data yet
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right">
                <button id="downloadSummaryCsvBtn">
                  <em>Download to CSV</em>
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    return;
  }

  const e = summary[0];
  const summaryFields = [
    {
      label: 'Monthly Repayment',
      value: `${currencySymbols[currentCurrency]}${numberWithCommas(e.monthlyPayment)}`,
    },
    {
      label: 'Total Loan Payment',
      value: `${currencySymbols[currentCurrency]}${numberWithCommas(e.totalPayment)}`,
    },
    {
      label: 'Loan Amount',
      value: `${currencySymbols[currentCurrency]}${numberWithCommas(e.principal)}`,
    },
    {
      label: 'Total Interest',
      value: `${currencySymbols[currentCurrency]}${numberWithCommas(e.totalInterest)}`,
    },
    {
      label: 'Number of Installments',
      value: numberWithCommas(e.calculatedYears * 12 + e.calculatedMonths),
    },
    { label: 'Interest Rate per annum', value: `${numberWithCommas(e.interestRate)}%` },
    { label: 'Loan Term', value: `${e.calculatedYears} year(s) ${e.calculatedMonths} month(s)` },
    { label: 'First Payment Date', value: dayjs(e.start).format('DD MMM, YYYY') },
    { label: 'Last Payment Date', value: dayjs(e.last).format('DD MMM, YYYY') },
  ];

  const rows = summaryFields
    .map((field) => `<tr><td>${field.label}</td><td>${field.value}</td></tr>`)
    .join('');

  if (!document.querySelector('.js-summary-table')) {
    summaryPlaceholder.innerHTML = `
      <div class="loan-summary-table js-summary-table">
        <table>
          <caption>Loan Summary Result</caption>
          <thead>
            <tr><th colspan="2">Payment Breakdown</th></tr>
          </thead>
          <tbody id="summary-body"></tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right">
                <button id="downloadSummaryCsvBtn">
                  ⬇️<em>Download to CSV</em>
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  const tbody = document.getElementById('summary-body');
  if (tbody) tbody.innerHTML = rows;

  document.getElementById('downloadSummaryCsvBtn')?.addEventListener('click', () => {
    const csvHeaders = summaryFields.map((f) => f.label).join(',');
    const csvRow = summaryFields
      .map((f) => {
        // Remove HTML tags for CSV
        const div = document.createElement('div');
        div.innerHTML = f.value;
        return div.textContent || div.innerText || '';
      })
      .join(',');
    const csvContent = [csvHeaders, csvRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'loan_summary.csv';
    link.click();
  });
}

let showAll = false;
// Render schedule table
function renderScheduleTable() {
  const max_rows = 10;

  if (!document.querySelector('.js-loan-schedule-table')) {
    schedulePlaceholder.innerHTML = `
      <div class="loan-schedule-table js-loan-schedule-table">
        <div class="estimated-payoff">
          <h1>Estimated payoff date</h1>
          <p class="payoff-p">—</p>
          <h2>Current Balance</h2>
          <p class="bal-p">—</p>
        </div>
        <div class="table-container">
          <table>
          <caption>Amortisation Schedule</caption>
          <thead>
            <tr class="schedule-th">
              <th>Payment Date</th>
              <th>Monthly Repayment</th>
              <th>Interest</th>
              <th>Principal</th>
              <th>Current Balance</th>
            </tr>
          </thead>
          <tbody id="schedule-body"></tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align:right">
                <button id="downloadCsvBtn">
                  <em>Download to CSV</em>
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>  
      </div>`;
  }

  function getRows() {
    const today = dayjs();
    let foundCurrent = false;
    return (showAll ? schedule : schedule.slice(0, max_rows))
      .map((e) => {
        let rowClass = '';
        if (!foundCurrent && dayjs(e.date).isAfter(today, 'month')) {
          rowClass = 'current-payment';
          foundCurrent = true;
        } else if (dayjs(e.date).isBefore(today, 'month')) {
          rowClass = 'past-payment';
        } else {
          rowClass = 'future-payment';
        }
        return `
          <tr class="${rowClass}">
            <td>${dayjs(e.date).format('D/M/YYYY')}</td>
            <td>${currencySymbols[currentCurrency]}${numberWithCommas(e.monthlyPayment)}</td>
            <td>${currencySymbols[currentCurrency]}${numberWithCommas(e.interest)}</td>
            <td>${currencySymbols[currentCurrency]}${numberWithCommas(e.principal)}</td>
            <td>${currencySymbols[currentCurrency]}${numberWithCommas(e.balance)}</td>
          </tr>`;
      })
      .join('');
  }

  const tbody = document.getElementById('schedule-body')!;
  if (!schedule.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center">No schedule data yet</td></tr>';
  } else {
    tbody.innerHTML = getRows();
  }

  // Update payoff and balance
  const payoffDate = schedule.at(-1)?.date
    ? dayjs(schedule.at(-1)!.date).format('D MMMM, YYYY')
    : '—';
  (document.querySelector('.estimated-payoff .payoff-p') as HTMLElement).textContent = payoffDate;
  const currentEntry = schedule.find((e) => dayjs(e.date).isSame(dayjs(), 'month'));
  const balElem = document.querySelector('.estimated-payoff .bal-p') as HTMLElement | null;
  if (balElem) {
    if (currentEntry) {
      balElem.innerHTML = `${currencySymbols[currentCurrency]}${numberWithCommas(
        currentEntry.balance
      )}`;
    } else if (schedule.length) {
      // Show last balance if no current month payment
      balElem.innerHTML = `${currencySymbols[currentCurrency]}${numberWithCommas(
        schedule[schedule.length - 1].balance
      )}`;
    } else {
      balElem.textContent = '—';
    }
  }

  // CSV Download
  document.getElementById('downloadCsvBtn')?.addEventListener('click', () => {
    const csvHeaders = [
      'Payment Date',
      'Monthly Repayment',
      'Interest',
      'Principal',
      'Current Balance',
    ];
    const csvRows = schedule.map((entry) =>
      [
        dayjs(entry.date).format('D/M/YYYY'),
        entry.monthlyPayment,
        entry.interest,
        entry.principal,
        entry.balance,
      ].join(',')
    );
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'loan_schedule.csv';
    link.click();
  });

  // See More/Less button logic
  let seeMoreBtn = document.getElementById('seeMoreBtn') as HTMLButtonElement | null;
  // Find the tfoot and its td directly from the table
  const table = tbody.closest('table');
  const tfootTd = table?.querySelector('tfoot td');

  if (!seeMoreBtn && schedule.length > max_rows && tfootTd) {
    const btn = document.createElement('button');
    btn.id = 'seeMoreBtn';
    btn.textContent = 'See More';
    tfootTd.prepend(btn);
    seeMoreBtn = btn;
  }
  if (seeMoreBtn) {
    seeMoreBtn.textContent = showAll ? 'See Less' : 'See More';
    seeMoreBtn.onclick = () => {
      showAll = !showAll;
      tbody.innerHTML = getRows();
      seeMoreBtn.textContent = showAll ? 'See Less' : 'See More';
    };
  }
}

// Preprocessing the user input functionality
export const inputPreprocessing = (ctx: HTMLCanvasElement) => {
  const form = document.querySelector('form[name="loanDetailsForm"]') as HTMLFormElement;
  if (!form) {
    console.error('Loan form not found in DOM');
    return;
  }

  const amountInput = form.querySelector('.js-loan-amount') as HTMLInputElement;
  const rateInput = form.querySelector('.js-loan-interest') as HTMLInputElement;
  const yearsInput = form.querySelector('.js-loan-term-years') as HTMLInputElement;
  const monthsInput = form.querySelector('.js-loan-term-month') as HTMLInputElement;
  const startInput = form.querySelector('.js-loan-start-date') as HTMLInputElement;
  const calcButton = form.querySelector('.js-calculate-loan') as HTMLInputElement;

  initLiveFormatting(amountInput);

  calcButton.addEventListener('click', (e) => {
    e.preventDefault();

    const loanDetails: LoanDetails = {
      amount: parseFloat(stripCommas(amountInput.value)),
      interestRate: parseFloat(rateInput.value),
      loanTermYears: parseInt(yearsInput.value, 10) || undefined,
      loanTermMonths: parseInt(monthsInput.value, 10) || undefined,
      startDate: startInput.value,
    };

    /* clear & keyboard nav */
    const inputs = [amountInput, rateInput, yearsInput, monthsInput, startInput];

    inputs.forEach((inp, i) => {
      inp.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();

          const isOptional = inp.hasAttribute('data-optional');
          const hasValue = inp.value && inp.value.trim().length > 0;

          if (hasValue || isOptional) {
            const nextInput = inputs[i + 1];
            if (nextInput) {
              nextInput.focus();
            } else {
              calcButton.click();
            }
          } else {
            // Optionally, give feedback (e.g., red border)
            inp.focus();
          }
        }
      });
    });

    //input validation
    const years = loanDetails.loanTermYears;
    const months = loanDetails.loanTermMonths;
    const onlyOneTerm =
      (years && years > 0 && (!months || months === 0)) ||
      (months && months > 0 && (!years || years === 0));
    const isValidInput =
      !isNaN(loanDetails.amount) &&
      loanDetails.amount >= 500 &&
      !isNaN(loanDetails.interestRate) &&
      loanDetails.interestRate > 0 &&
      onlyOneTerm &&
      loanDetails.startDate !== '';

    const termError = form.querySelector('#term-error') as HTMLElement;
    function setTermError(show: boolean) {
      if (show) {
        yearsInput.classList.add('invalid');
        monthsInput.classList.add('invalid');
        termError.style.display = 'block';
      } else {
        yearsInput.classList.remove('invalid');
        monthsInput.classList.remove('invalid');
        termError.style.display = 'none';
      }
    }
    if (!onlyOneTerm) {
      setTermError(true);
    } else {
      setTermError(false);
    }

    if (!isValidInput) return;

    const loanResult = calculateLoan(loanDetails);
    if (!loanResult) return;

    // Chart
    myChart?.destroy();
    myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [
          {
            label: '',
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
          legend: { display: false },
        },
        maintainAspectRatio: false,
      },
    });

    // Chart figures
    (
      document.querySelector('.js-loan-chart-amount') as HTMLDivElement
    ).innerHTML = `<p>Loan Amount</p><span class="chart-amount-color">${
      currencySymbols[currentCurrency]
    }${numberWithCommas(loanResult.principal)}</span>`;
    (
      document.querySelector('.js-total-chart-interest') as HTMLDivElement
    ).innerHTML = `<p>Total Interest</p><span class="chart-interest-color">${
      currencySymbols[currentCurrency]
    }${numberWithCommas(loanResult.totalInterest)}</span>`;
    (
      document.querySelector('.js-total-chart-payment') as HTMLDivElement
    ).innerHTML = `<p>Total Payment</p><span>${currencySymbols[currentCurrency]}${numberWithCommas(
      loanResult.totalPayment
    )}</span>`;

    // Clear inputs
    [amountInput, rateInput, yearsInput, monthsInput, startInput].forEach(
      (inp) => (inp.value = '')
    );

    // Summary and Schedule
    summary.length = 0;
    schedule.length = 0;

    summary.push({
      monthlyPayment: +loanResult.monthlyPayment.toFixed(2),
      totalPayment: +loanResult.totalPayment.toFixed(2),
      principal: +loanResult.principal.toFixed(2),
      totalInterest: +loanResult.totalInterest.toFixed(2),
      installmentNum: loanResult.calculatedYears * 12 + loanResult.calculatedMonths,
      interestRate: +loanResult.interest.toFixed(2),
      calculatedYears: loanResult.calculatedYears,
      calculatedMonths: loanResult.calculatedMonths,
      start: loanResult.start,
      last: loanResult.last,
    });

    const totalMonths = loanResult.calculatedYears * 12 + loanResult.calculatedMonths;
    let balance = loanResult.principal;
    const formatStartDate = dayjs(loanResult.start);

    for (let i = 0; i < totalMonths; i++) {
      const currentDate = formatStartDate.add(i, 'month');
      const interest = +(balance * loanResult.calculatedInterest).toFixed(2);
      const principal = +(loanResult.monthlyPayment - interest).toFixed(2);
      balance = +(balance - principal).toFixed(2);

      schedule.push({
        date: currentDate.toISOString(),
        monthlyPayment: +loanResult.monthlyPayment.toFixed(2),
        interest,
        principal,
        balance: balance > 0 ? balance : 0,
      });
    }

    renderSummaryTable();
    renderScheduleTable();

    // Chart details object
    const chartDetails = {
      principal: loanResult.principal,
      totalInterest: loanResult.totalInterest,
      totalPayment: loanResult.totalPayment,
    };

    // Save to localStorage
    saveLoanResultsToLocalStorage(
      chartDetails,
      summary[0], // first (and only) summary entry
      schedule // full amortisation schedule
    );
  });
};

// Save results to localStorage
function saveLoanResultsToLocalStorage(
  chartDetails: { principal: number; totalInterest: number; totalPayment: number },
  summaryResult: SummaryEntry,
  amortisationSchedule: ScheduleEntry[]
) {
  // Clear previous results
  localStorage.removeItem('loan_chart_details');
  localStorage.removeItem('loan_summary_result');
  localStorage.removeItem('loan_amortisation_schedule');

  // Save new results
  localStorage.setItem('loan_chart_details', JSON.stringify(chartDetails));
  localStorage.setItem('loan_summary_result', JSON.stringify(summaryResult));
  localStorage.setItem('loan_amortisation_schedule', JSON.stringify(amortisationSchedule));
}

// Render the data on the page
document.addEventListener('DOMContentLoaded', () => {
  const savedCurrency = localStorage.getItem('selected_currency');
  if (savedCurrency && currencySymbols[savedCurrency]) {
    currentCurrency = savedCurrency;
    if (currencySelect) currencySelect.value = savedCurrency;
  }

  // Render content first
  renderForm();
  renderSummaryTable();
  renderScheduleTable();

  // Query elements after they’ve been injected
  const formElement = document.querySelector('.js-form-placeholder form') as HTMLElement;
  const summaryTable = document.querySelector('.js-summary-placeholder div') as HTMLElement;
  const scheduleTable = document.querySelector('.js-schedule-placeholder div') as HTMLElement;

  const loanSummaryNav = document.querySelector('.js-loan-summary-nav') as HTMLLIElement;
  const calculateLoanNav = document.querySelector('.js-calculate-nav') as HTMLLIElement;
  const loanScheduleNav = document.querySelector('.js-loan-schedule-nav') as HTMLLIElement;

  // Set up navigation logic
  toggleNavLink(loanSummaryNav, summaryTable, formElement, scheduleTable);
  toggleNavLink(calculateLoanNav, formElement, summaryTable, scheduleTable);
  toggleNavLink(loanScheduleNav, scheduleTable, formElement, summaryTable);

  const canvas = document.getElementById('myChart') as HTMLCanvasElement;

  inputPreprocessing(canvas);

  // Load from localStorage if available
  const chartDetails = JSON.parse(localStorage.getItem('loan_chart_details') || 'null');
  const summaryResult = JSON.parse(localStorage.getItem('loan_summary_result') || 'null');
  const amortisationSchedule = JSON.parse(
    localStorage.getItem('loan_amortisation_schedule') || 'null'
  );

  if (chartDetails && summaryResult && amortisationSchedule) {
    // Push loaded data into site's state/arrays
    summary.length = 0;
    summary.push(summaryResult);
    schedule.length = 0;
    schedule.push(...amortisationSchedule);

    // Re-render tables/charts
    renderSummaryTable();
    renderScheduleTable();

    // Re-create Chart.js chart
    if (myChart) {
      myChart.destroy();
    }
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;
    if (canvas && chartDetails) {
      myChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [
            {
              label: '',
              data: [chartDetails.principal, chartDetails.totalInterest],
              borderWidth: 1,
              backgroundColor: ['rgb(31, 52, 243)', 'rgb(247, 47, 91)'],
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          maintainAspectRatio: false,
        },
      });

      // Re-render Chart details
      (
        document.querySelector('.js-loan-chart-amount') as HTMLDivElement
      ).innerHTML = `<p>Loan Amount</p><span class="chart-amount-color">${
        currencySymbols[currentCurrency]
      }${numberWithCommas(chartDetails.principal)}</span>`;
      (
        document.querySelector('.js-total-chart-interest') as HTMLDivElement
      ).innerHTML = `<p>Total Interest</p><span class="chart-interest-color">${
        currencySymbols[currentCurrency]
      }${numberWithCommas(chartDetails.totalInterest)}</span>`;
      (
        document.querySelector('.js-total-chart-payment') as HTMLDivElement
      ).innerHTML = `<p>Total Payment</p><span>${
        currencySymbols[currentCurrency]
      }${numberWithCommas(chartDetails.totalPayment)}</span>`;
    }
  }
});
