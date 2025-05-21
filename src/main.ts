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

// Utility function: formats figures with commas
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

function initLiveFormatting(el: HTMLInputElement) {
  el.addEventListener('input', (event) => {
    const raw = stripCommas(el.value);
    if (!raw) {
      el.value = '';
      return;
    }
    // Check for non-numeric input (excluding commas)
    if (!/^\d+$/.test(raw)) {
      const isBackspaceorDelete =
        (event as InputEvent).inputType === 'deleteContentBackward' ||
        (event as InputEvent).inputType === 'deleteContentForward';
      if (!isBackspaceorDelete) {
        console.log('letters not allowed, please input number instead');
      }

      const digitsOnly = raw.replace(/\D+/g, '');
      el.value = numberWithCommas(digitsOnly, true);
      return;
    }
    // Only show commas, no decimals, while typing
    el.value = numberWithCommas(raw, true);
  });

  // On blur, format with decimals
  el.addEventListener('blur', () => {
    const raw = stripCommas(el.value);
    if (!raw || !/^\d+$/.test(raw)) {
      el.value = '';
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
    <form action="https://httpbin.org/get" method="get" name="loanDetailsForm">
     <div class="currency-choice">Currency</div>
      <label class="form-header">Calculate loan interest</label>

      <label for="loan-amount"> Loan Amount </label>
      <div class="amount-wrapper">
        <span class="naira-symbol">&#8358;</span>
        <input
          type="text"
          id="loan-amount"
          class="loan-input amount-input js-loan-amount"
          placeholder="Enter loan amount"
          required
        />
      </div>

      <label for="loan-interest"> Annual Interest Rate </label>
      <div class="interest-wrapper">
        <span class="percentage-symbol">%</span>
        <input
          type="number"
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

      <label> Loan Term <span class="per-term">per/month</span></label>
        <input
          type="number"
          data-optional
          class="loan-input js-loan-term-month"
          placeholder="Enter loan term in"
        />
      
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
    { label: 'Monthly Repayment', value: `&#8358;${numberWithCommas(e.monthlyPayment)}` },
    { label: 'Total Loan Payment', value: `&#8358;${numberWithCommas(e.totalPayment)}` },
    { label: 'Loan Amount', value: `&#8358;${numberWithCommas(e.principal)}` },
    { label: 'Total Interest', value: `&#8358;${numberWithCommas(e.totalInterest)}` },
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
            <td>&#8358;${numberWithCommas(e.monthlyPayment)}</td>
            <td>&#8358;${numberWithCommas(e.interest)}</td>
            <td>&#8358;${numberWithCommas(e.principal)}</td>
            <td>&#8358;${numberWithCommas(e.balance)}</td>
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
      balElem.innerHTML = `&#8358;${numberWithCommas(currentEntry.balance)}`;
    } else if (schedule.length) {
      // Show last balance if no current month payment
      balElem.innerHTML = `&#8358;${numberWithCommas(schedule[schedule.length - 1].balance)}`;
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
    ).innerHTML = `<p>Loan Amount</p><span>&#8358;${numberWithCommas(loanResult.principal)}</span>`;
    (
      document.querySelector('.js-total-chart-interest') as HTMLDivElement
    ).innerHTML = `<p>Total Interest</p><span>&#8358;${numberWithCommas(
      loanResult.totalInterest
    )}</span>`;
    (
      document.querySelector('.js-total-chart-payment') as HTMLDivElement
    ).innerHTML = `<p>Total Payment</p><span>&#8358;${numberWithCommas(
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
  });
};

// Render the data on the page
document.addEventListener('DOMContentLoaded', () => {
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
});
