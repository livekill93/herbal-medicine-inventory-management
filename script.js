document.addEventListener('DOMContentLoaded', () => {
    const medicationForm = document.getElementById('medication-form');
    const medicationInput = document.getElementById('medication-input');
    const expiryDateInput = document.getElementById('expiry-date-input');
    const quantityInput = document.getElementById('quantity-input');
    const medicationTableBody = document.getElementById('medication-list');
    const expiredMedicationTableBody = document.getElementById('expired-medication-list');
    const exportButton = document.getElementById('export-xml');
    const importInput = document.getElementById('import-xml');
    const filterForm = document.getElementById('filter-form');
    const filterSortSelect = document.getElementById('filter-sort');
    const printButton = document.getElementById('print-list');
    const clearAllButton = document.getElementById('clear-all');

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
        saveMedication(medicationData);

        // Render updated list
        renderMedications();
    }

    function saveMedication(medicationData) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.push(medicationData);
        localStorage.setItem('medications', JSON.stringify(medications));
    }

    function loadMedications() {
        renderMedications();
    }

    function removeMedication(medication, expiryDate, quantity) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications = medications.filter(m => !(m.medication === medication && m.expiryDate === expiryDate && m.quantity === quantity));
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
            return 'expired'; // Expired
        } else if (timeDifference <= oneWeekInMillis) {
            return 'danger'; // One week or less
        } else if (timeDifference <= oneMonthInMillis) {
            return 'warning'; // One month or less
        } else {
            return ''; // More than one month
        }
    }

    function renderMedications() {
        medicationTableBody.innerHTML = ''; // Clear existing rows
        expiredMedicationTableBody.innerHTML = ''; // Clear existing rows

        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        const sortValue = filterSortSelect.value;
        
        if (sortValue === 'name') {
            medications.sort((a, b) => a.medication.localeCompare(b.medication));
        } else if (sortValue === 'expiryDate') {
            medications.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        }

        medications.forEach(({ medication, expiryDate, quantity }) => {
            const row = document.createElement('tr');
            const colorClass = getColorForExpiryDate(expiryDate);
            row.classList.add(colorClass);
            row.innerHTML = `
                <td>${medication}</td>
                <td>${expiryDate}</td>
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

            if (colorClass === 'expired') {
                expiredMedicationTableBody.appendChild(row);
            } else {
                medicationTableBody.appendChild(row);
            }
        });
    }

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

    function jsonToXml(json) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<medications>\n';
        json.forEach(({ medication, expiryDate, quantity }) => {
            xml += `  <medication>\n    <name>${medication}</name>\n    <expiryDate>${expiryDate}</expiryDate>\n    <quantity>${quantity}</quantity>\n  </medication>\n`;
        });
        xml += '</medications>';
        return xml;
    }

    function xmlToJson(xml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        const medicationNodes = xmlDoc.getElementsByTagName('medication');
        const medications = [];
        for (let i = 0; i < medicationNodes.length; i++) {
            const medication = medicationNodes[i].getElementsByTagName('name')[0].textContent;
            const expiryDate = medicationNodes[i].getElementsByTagName('expiryDate')[0].textContent;
            const quantity = medicationNodes[i].getElementsByTagName('quantity')[0].textContent;
            medications.push({ medication, expiryDate, quantity });
        }
        return medications;
    }

    printButton.addEventListener('click', () => {
        window.print(); // Invoke the browser's print dialog
    });

    clearAllButton.addEventListener('click', () => {
        if (confirm('정말로 전체 약재를 삭제하시겠습니까?')) {
            localStorage.removeItem('medications');
            renderMedications(); // Re-render after clearing
        }
    });
});
