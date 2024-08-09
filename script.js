document.addEventListener('DOMContentLoaded', () => {
    const medicationForm = document.getElementById('medication-form');
    const medicationInput = document.getElementById('medication-input');
    const expiryDateInput = document.getElementById('expiry-date-input');
    const quantityInput = document.getElementById('quantity-input');
    const medicationTableBody = document.getElementById('medication-list');
    const expiredMedicationTableBody = document.getElementById('expired-medication-list');
    const exportButton = document.getElementById('export-xml');
    const importInput = document.getElementById('import-xml');
    const printButton = document.getElementById('print-list');
    const exportExcelButton = document.getElementById('export-excel');

    // Load medications from local storage
    loadMedications();

    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const medication = medicationInput.value.trim();
        const expiryDate = expiryDateInput.value;
        const quantity = quantityInput.value;
        if (medication && expiryDate && quantity) {
            addMedication(medication, expiryDate, quantity);
            medicationInput.value = '';
            expiryDateInput.value = '';
            quantityInput.value = '';
        }
    });

    function addMedication(medication, expiryDate, quantity) {
        const medicationData = { medication, expiryDate, quantity };
        
        // Save to local storage
        saveMedication(medication, expiryDate, quantity);

        // Render updated list
        renderMedications();
    }

    function saveMedication(medication, expiryDate, quantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.push({ medication, expiryDate, quantity });
        localStorage.setItem('medications', JSON.stringify(medications));
    }

    function loadMedications() {
        renderMedications();
    }

    function removeMedication(medication, expiryDate, quantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications = medications.filter(m => m.medication !== medication || m.expiryDate !== expiryDate || m.quantity !== quantity);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications(); // Re-render list after removal
    }

    function updateMedicationQuantity(medication, expiryDate, newQuantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        const medIndex = medications.findIndex(m => m.medication === medication && m.expiryDate === expiryDate);
        if (medIndex > -1) {
            medications[medIndex].quantity = newQuantity;
            localStorage.setItem('medications', JSON.stringify(medications));
            renderMedications(); // Re-render list after update
        }
    }

    function getColorForExpiryDate(expiryDate) {
        const expiryDateObj = new Date(expiryDate);
        const now = new Date();
        const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds
        const timeDifference = expiryDateObj - now;

        if (timeDifference < 0) {
            return 'gray'; // Expired
        } else if (timeDifference <= oneWeekInMillis) {
            return 'red'; // One week or less
        } else if (timeDifference <= oneMonthInMillis) {
            return 'yellow'; // One month or less
        } else {
            return 'black'; // More than one month
        }
    }

    function renderMedications() {
        medicationTableBody.innerHTML = ''; // Clear existing rows
        expiredMedicationTableBody.innerHTML = ''; // Clear existing rows

        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        medications.forEach(({ medication, expiryDate, quantity }) => {
            const row = document.createElement('tr');
            const color = getColorForExpiryDate(expiryDate);
            row.innerHTML = `
                <td style="color: ${color};">${medication}</td>
                <td style="color: ${color};">${expiryDate}</td>
                <td>
                    <input type="number" class="quantity-input" value="${quantity}" min="1">
                    <button class="save-button">저장</button>
                </td>
                <td><span class="delete">삭제</span></td>
            `;

            row.querySelector('.delete').addEventListener('click', () => {
                removeMedication(medication, expiryDate, quantity);
            });

            row.querySelector('.save-button').addEventListener('click', () => {
                const newQuantity = row.querySelector('.quantity-input').value;
                updateMedicationQuantity(medication, expiryDate, newQuantity);
            });

            if (new Date(expiryDate) < new Date()) {
                expiredMedicationTableBody.appendChild(row);
            } else {
                medicationTableBody.appendChild(row);
            }
        });
    }

    function downloadXML() {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        let xml = '<?xml version="1.0" encoding="UTF-8"?><medications>';

        medications.forEach(({ medication, expiryDate, quantity }) => {
            xml += `<medication>
                        <name>${medication}</name>
                        <expiryDate>${expiryDate}</expiryDate>
                        <quantity>${quantity}</quantity>
                    </medication>`;
        });

        xml += '</medications>';

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medications.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function downloadExcel() {
        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.table_to_sheet(document.querySelector('#medications-container table'));

        XLSX.utils.book_append_sheet(wb, ws, '약제 리스트');
        XLSX.writeFile(wb, 'medications.xlsx');
    }

    importInput.addEventListener('change', handleXMLImport);
    exportButton.addEventListener('click', downloadXML);
    exportExcelButton.addEventListener('click', downloadExcel);

    function handleXMLImport(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
                const medications = xmlDoc.getElementsByTagName('medication');

                Array.from(medications).forEach(med => {
                    const name = med.getElementsByTagName('name')[0].textContent;
                    const expiryDate = med.getElementsByTagName('expiryDate')[0].textContent;
                    const quantity = med.getElementsByTagName('quantity')[0].textContent;
                    addMedication(name, expiryDate, quantity);
                });
            };
            reader.readAsText(file);
        }
    }

    printButton.addEventListener('click', () => {
        let printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>약제 리스트</title>
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 5px;
                        text-align: left;
                    }
                    th {
                        background: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                <h1>약제 리스트</h1>
                ${document.querySelector('#medications-container').innerHTML}
                ${document.querySelector('#expired-medications-container').innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    });
});
