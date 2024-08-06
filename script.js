document.addEventListener('DOMContentLoaded', () => {
    const medicationForm = document.getElementById('medication-form');
    const medicationInput = document.getElementById('medication-input');
    const expiryDateInput = document.getElementById('expiry-date-input');
    const medicationTableBody = document.getElementById('medication-list');
    const exportButton = document.getElementById('export-xml');
    const importInput = document.getElementById('import-xml');

    // Load medications from local storage
    loadMedications();

    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const medication = medicationInput.value.trim();
        const expiryDate = expiryDateInput.value;
        if (medication && expiryDate) {
            addMedication(medication, expiryDate);
            medicationInput.value = '';
            expiryDateInput.value = '';
        }
    });

    function addMedication(medication, expiryDate) {
        const medicationData = { medication, expiryDate };
        
        // Save to local storage
        saveMedication(medication, expiryDate);

        // Render updated list
        renderMedications();
    }

    function saveMedication(medication, expiryDate) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.push({ medication, expiryDate });
        localStorage.setItem('medications', JSON.stringify(medications));
    }

    function loadMedications() {
        renderMedications();
    }

    function removeMedication(medication, expiryDate) {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications = medications.filter(m => m.medication !== medication || m.expiryDate !== expiryDate);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications(); // Re-render list after removal
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

        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        medications.forEach(({ medication, expiryDate }) => {
            const row = document.createElement('tr');
            const color = getColorForExpiryDate(expiryDate);
            row.innerHTML = `
                <td style="color: ${color};">${medication}</td>
                <td style="color: ${color};">${expiryDate}</td>
                <td><span class="delete" style="color: ${color};">x</span></td>
            `;
            medicationTableBody.appendChild(row);

            row.querySelector('.delete').addEventListener('click', () => {
                removeMedication(medication, expiryDate);
            });
        });
    }

    exportButton.addEventListener('click', () => {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const xmlString = convertToXML(medications);
        downloadXML(xmlString, 'medications.xml'); // Set file name
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const xmlString = event.target.result;
                const medications = parseXML(xmlString);
                localStorage.setItem('medications', JSON.stringify(medications));
                renderMedications(); // Re-render list from imported XML
            };
            reader.readAsText(file);
        }
    });

    function convertToXML(medications) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<medications>\n';
        medications.forEach(med => {
            xml += `  <medication>\n    <name>${med.medication}</name>\n    <expiryDate>${med.expiryDate}</expiryDate>\n  </medication>\n`;
        });
        xml += '</medications>';
        return xml;
    }

    function downloadXML(xmlString, filename) {
        const blob = new Blob([xmlString], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function parseXML(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const medications = [];
        const medicationNodes = xmlDoc.getElementsByTagName('medication');
        for (let i = 0; i < medicationNodes.length; i++) {
            const name = medicationNodes[i].getElementsByTagName('name')[0].textContent;
            const expiryDate = medicationNodes[i].getElementsByTagName('expiryDate')[0].textContent;
            medications.push({ medication: name, expiryDate });
        }
        return medications;
    }
});
