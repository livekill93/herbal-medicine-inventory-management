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

    // 로컬 스토리지에서 약제 데이터를 불러옴
    loadMedications();

    // 폼 제출 시 약제 추가
    medicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addMedication(medicationInput.value, expiryDateInput.value, quantityInput.value);
        medicationForm.reset();
    });

    // 약제 추가 함수
    function addMedication(medication, expiryDate, quantity) {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        medications.push({ medication, expiryDate, quantity });
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    }

    // 약제 데이터 업데이트 함수
    function updateMedicationQuantity(medication, expiryDate, newQuantity) {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const updatedMedications = medications.map(m => {
            if (m.medication === medication && m.expiryDate === expiryDate) {
                return { ...m, quantity: newQuantity };
            }
            return m;
        });
        localStorage.setItem('medications', JSON.stringify(updatedMedications));
        renderMedications();
    }

    // 약제 삭제 함수
    function removeMedication(medication, expiryDate) {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const updatedMedications = medications.filter(m => !(m.medication === medication && m.expiryDate === expiryDate));
        localStorage.setItem('medications', JSON.stringify(updatedMedications));
        renderMedications();
    }

    // 유통 기한에 따른 색상 클래스 설정 함수
    function getColorForExpiryDate(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const oneMonth = 1000 * 60 * 60 * 24 * 30;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        if (expiry < now) return 'expired';
        if (expiry - now < oneWeek) return 'danger';
        if (expiry - now < oneMonth) return 'warning';
        return '';
    }

    // 약제 데이터를 렌더링
    function renderMedications() {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        medicationTableBody.innerHTML = '';
        expiredMedicationTableBody.innerHTML = '';
        const now = new Date();

        medications.sort((a, b) => {
            if (filterSort.value === 'name') {
                return a.medication.localeCompare(b.medication);
            } else {
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            }
        });

        medications.forEach(({ medication, expiryDate, quantity }) => {
            const row = document.createElement('tr');
            const colorClass = getColorForExpiryDate(expiryDate);

            row.innerHTML = `
                <td class="${colorClass}">${medication}</td>
                <td class="${colorClass}">${expiryDate}</td>
                <td class="${colorClass}"><input type="number" class="quantity-input" value="${quantity}" min="1"></td>
                <td><span class="delete">삭제</span></td>
            `;

            const quantityInputField = row.querySelector('.quantity-input');
            quantityInputField.addEventListener('change', (e) => {
                const newQuantity = e.target.value;
                updateMedicationQuantity(medication, expiryDate, newQuantity);
            });

            row.querySelector('.delete').addEventListener('click', () => {
                removeMedication(medication, expiryDate);
            });

            if (new Date(expiryDate) < now) {
                expiredMedicationTableBody.appendChild(row);
            } else {
                medicationTableBody.appendChild(row);
            }
        });
    }

    // XML 파일로 저장
    exportButton.addEventListener('click', () => {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const xml = jsonToXml(medications);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medications.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // XML 파일 불러오기
    importButton.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const xml = e.target.result;
                const medications = xmlToJson(xml);
                localStorage.setItem('medications', JSON.stringify(medications));
                renderMedications();
            };
            reader.readAsText(file);
        }
    });

    // 정렬 필터 적용
    applyFilterButton.addEventListener('click', () => {
        renderMedications();
    });

    // 약제 리스트 인쇄
    printButton.addEventListener('click', () => {
        window.print();
    });

    // 엑셀 파일로 저장
    excelExportButton.addEventListener('click', () => {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const ws = XLSX.utils.json_to_sheet(medications);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Medications');
        XLSX.writeFile(wb, 'medications.xlsx');
    });

    // 전체 삭제
    clearAllButton.addEventListener('click', () => {
        localStorage.removeItem('medications');
        renderMedications();
    });

    // 유통기한 지난 약제만 삭제
    clearExpiredButton.addEventListener('click', () => {
        let medications = JSON.parse(localStorage.getItem('medications')) || [];
        const now = new Date();
        medications = medications.filter(m => new Date(m.expiryDate) >= now);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    });

    // JSON 데이터를 XML로 변환
    function jsonToXml(json) {
        let xml = '<medications>';
        json.forEach(({ medication, expiryDate, quantity }) => {
            xml += `
                <medication>
                    <name>${medication}</name>
                    <expiryDate>${expiryDate}</expiryDate>
                    <quantity>${quantity}</quantity>
                </medication>
            `;
        });
        xml += '</medications>';
        return xml;
    }

    // XML 데이터를 JSON으로 변환
    function xmlToJson(xml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        const medicationNodes = xmlDoc.getElementsByTagName('medication');
        const medications = Array.from(medicationNodes).map(node => ({
            medication: node.getElementsByTagName('name')[0].textContent,
            expiryDate: node.getElementsByTagName('expiryDate')[0].textContent,
            quantity: node.getElementsByTagName('quantity')[0].textContent,
        }));
        return medications;
    }

    // 로컬 스토리지에서 약제 데이터를 불러옴
    function loadMedications() {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        renderMedications();
    }
});
