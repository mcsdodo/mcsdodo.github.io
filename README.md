# mcsdodo.github.io

## [Platobné QR z XML](https://mcsdodo.github.io/platobne-qr/)

The tool converts a SEPA payment order in XML (`pain.001.001.03`) into one QR code and one payment link for each payment. Accounting programs export this file for import into internet banking.

For each payment, the page shows:

- a PAY by square QR code, which Slovak banking apps scan
- a payme link (Payment Link Standard of the Slovak Banking Association), which opens the filled-in payment order in the banking app on a phone
- the amount, the recipient, the IBAN, VS/SS/KS and the message

The page also makes text to copy into an email, with or without the QR images.

The page checks the payment count and the control sum against the XML header, and it checks the checksum of each IBAN.

The file is processed only in the browser. The page does not upload or store it. The page loads fonts and two libraries from CDNs: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) and [bysquare](https://github.com/xseman/bysquare).

The QR code and the link do not carry the payer account. Select it in the banking app.

| File | Content |
|---|---|
| [platobne-qr/index.html](platobne-qr/index.html) | The page: file input, QR codes, email text |
| [platobne-qr/core.js](platobne-qr/core.js) | XML parse, checks and payme links. No DOM access, so it also runs in Node |

## [Mzda alebo dividenda](https://mcsdodo.github.io/mzda-vs-dividenda/)

The tool compares two ways an owner of a Slovak s.r.o. can take money out of the company in 2026: as salary or as a dividend. Both are paid from the same pre-tax company money, so the page reduces each to one number, the share of a euro of company cost that actually reaches the owner.

The salary side counts gross pay, employer levies, employee levies, income tax, the child tax bonus and the meal allowance. The dividend side counts corporate income tax and the 7 % withholding. Salary, employer levies and the meal allowance are deductible company expenses, which is where the difference between the two columns comes from.

Inputs are the gross salary, the number of children in each age band, the meal allowance rates and days, and the corporate tax rate. The page marks the break-even gross salary, below which salary is cheaper and above which dividends are, and plots the effective rate across the salary range.

Meal allowance rates are switchable, because they rise on 1 December 2026 (MPSVR SR notice 255/2026 Z. z.): the minimum voucher goes from 6,98 to 7,35 € and the employer contribution from 3,84 to 4,05 € at the floor and 5,12 to 5,39 € at the tax-free ceiling.

The page does not model the minimum corporate tax, nor a deduction worth less because the salary pushes the company into a tax loss. It is an estimate and does not replace an accountant.

Nothing is sent anywhere, the page has no inputs to store. It loads fonts and, through an import map with pinned versions, React, Recharts and htm from CDNs, so there is no build step. If the chart library does not load, the numbers still work and only the curve is missing.

| File | Content |
|---|---|
| [mzda-vs-dividenda/index.html](mzda-vs-dividenda/index.html) | The page: inputs, the two columns, the chart |
| [mzda-vs-dividenda/core.js](mzda-vs-dividenda/core.js) | Levies, tax, child bonus and break-even. No DOM access, so it also runs in Node |
