document.addEventListener('DOMContentLoaded', () => {
    const medicationForm = document.getElementById('medication-form');
    const medicationInput = document.getElementById('medication-input');
    const expiryDateInput = document.getElementById('expiry-date-input');
    const quantityInput = document.getElementById('quantity-input');
    const medicationTableBody = document.getElementById('medication-list');
    const expiredMedicationTableBody = document.getElementById('expired-medication-list');
    const exportButton = document.getElementById('export-xml');
    const importInput = document.getElementById('import-xml');
    const applyFilterButton = document.getElementById('apply-filter');
    const printButton = document.getElementById('print-list');
    const excelExportButton = document.getElementById('excel-export');
    const clearAllButton = document.getElementById('clear-all');
    const clearExpiredButton = document.getElementById('clear-expired');
    const importButton = document.getElementById('import-button');
    const filterSort = document.getElementById('filter-sort');

    // Load medications from local storage
    function loadMedications() {
        renderMedications();
    }

    function addMedication(medication, expiryDate, quantity) {
        const medicationData = { medication, expiryDate, quantity };
        saveMedication(medicationData);
        renderMedications();
    }

    function saveMedication({ medication, expiryDate, quantity }) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.push({ medication, expiryDate, quantity });
        localStorage.setItem('medications', JSON.stringify(medications));
    }

    function removeMedication(medication, expiryDate, quantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications = medications.filter(m => !(m.medication === medication && m.expiryDate === expiryDate && m.quantity === quantity));
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    }

    function updateMedicationQuantity(medication, expiryDate, newQuantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        const medIndex = medications.findIndex(m => m.medication === medication && m.expiryDate === expiryDate);
        if (medIndex > -1) {
            medications[medIndex].quantity = newQuantity;
            localStorage.setItem('medications', JSON.stringify(medications));
            renderMedications();
        }
    }

    function getColorForExpiryDate(expiryDate) {
        const expiryDateObj = new Date(expiryDate);
        const now = new Date();
        const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;
        const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000;
        const timeDifference = expiryDateObj - now;

        if (timeDifference < 0) {
            return 'gray';
        } else if (timeDifference <= oneWeekInMillis) {
            return 'red';
        } else {
            return 'black';
        }
    }

    function renderMedications() {
        const sortBy = filterSort.value; // 선택한 정렬 기준
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        
        // 정렬 기준에 따라 데이터 정렬
        if (sortBy === 'name') {
            medications.sort((a, b) => a.medication.localeCompare(b.medication));
        } else if (sortBy === 'expiryDate') {
            medications.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        }

        medicationTableBody.innerHTML = '';
        expiredMedicationTableBody.innerHTML = '';

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

            if (color === 'gray') {
                expiredMedicationTableBody.appendChild(row);
            } else {
                medicationTableBody.appendChild(row);
            }
        });
    }

    applyFilterButton.addEventListener('click', () => {
        renderMedications();
    });

    exportButton.addEventListener('click', () => {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const xmlData = jsonToXml(medications);
        const blob = new Blob([xmlData], { type: 'application/xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'medications.xml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importButton.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const xmlData = event.target.result;
                const medications = xmlToJson(xmlData);
                localStorage.setItem('medications', JSON.stringify(medications));
                renderMedications();
            };
            reader.readAsText(file);
        }
    });

    excelExportButton.addEventListener('click', () => {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library is not loaded.');
            return;
        }

        const workbook = XLSX.utils.book_new();
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const worksheet = XLSX.utils.json_to_sheet(medications);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Medications');
        XLSX.writeFile(workbook, 'medications.xlsx');
    });

    printButton.addEventListener('click', () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Print</title>
                <style>
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>약제 리스트</h1>
                <table>
                    <thead>
                        <tr>
                            <th>약제명</th>
                            <th>유통 기한</th>
                            <th>개수</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicationTableBody.innerHTML}
                        ${expiredMedicationTableBody.innerHTML}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    });

    clearAllButton.addEventListener('click', () => {
        localStorage.removeItem('medications');
        renderMedications();
    });

    clearExpiredButton.addEventListener('click', () => {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        const now = new Date();
        medications = medications.filter(m => new Date(m.expiryDate) > now);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    });

    function jsonToXml(json) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<medications>\n';
        json.forEach(({ medication, expiryDate, quantity }) => {
            xml += `  <medication>\n`;
            xml += `    <name>${medication}</name>\n`;
            xml += `    <expiryDate>${expiryDate}</expiryDate>\n`;
            xml += `    <quantity>${quantity}</quantity>\n`;
            xml += `  </medication>\n`;
        });
        xml += '</medications>';
        return xml;
    }

    function xmlToJson(xml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const medications = [];
        const medicationNodes = xmlDoc.getElementsByTagName('medication');
        for (let i = 0; i < medicationNodes.length; i++) {
            const med = medicationNodes[i];
            const medication = med.getElementsByTagName('name')[0].textContent;
            const expiryDate = med.getElementsByTagName('expiryDate')[0].textContent;
            const quantity = med.getElementsByTagName('quantity')[0].textContent;
            medications.push({ medication, expiryDate, quantity });
        }
        return medications;
    }

    // Initial load
    loadMedications();
});
