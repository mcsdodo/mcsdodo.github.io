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
