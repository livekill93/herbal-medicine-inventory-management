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
    const searchInput = document.getElementById('search-input');

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
        medications.push({ medication, expiryDate, quantity, remark: '' });
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

    // 비고란 업데이트 함수
    function updateMedicationRemark(medication, expiryDate, newRemark) {
        const medications = JSON.parse(localStorage.getItem('medications')) || [];
        const updatedMedications = medications.map(m => {
            if (m.medication === medication && m.expiryDate === expiryDate) {
                return { ...m, remark: newRemark };
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
        const searchQuery = searchInput.value.toLowerCase();

        // 필터 및 정렬
        const filteredMedications = medications
            .filter(({ medication }) => medication.toLowerCase().includes(searchQuery))
            .sort((a, b) => {
                if (filterSort.value === 'name') {
                    return a.medication.localeCompare(b.medication);
                } else if (filterSort.value === 'expiryDate') {
                    return new Date(a.expiryDate) - new Date(b.expiryDate);
                } else if (filterSort.value === 'quantity') {
                    return a.quantity - b.quantity;
                }
                return 0;
            });

        filteredMedications.forEach(({ medication, expiryDate, quantity, remark }) => {
            const row = document.createElement('tr');
            const colorClass = getColorForExpiryDate(expiryDate);

            row.innerHTML = `
                <td class="${colorClass}">${medication}</td>
                <td class="${colorClass}">${expiryDate}</td>
                <td class="${colorClass}"><input type="number" class="quantity-input" value="${quantity}" min="1"></td>
                <td><span class="delete">삭제</span></td>
                <td class="${colorClass}"><input type="text" class="remark-input" value="${remark || ''}" /></td>
            `;

            const quantityInputField = row.querySelector('.quantity-input');
            const remarkInputField = row.querySelector('.remark-input');

            quantityInputField.addEventListener('change', (e) => {
                const newQuantity = e.target.value;
                updateMedicationQuantity(medication, expiryDate, newQuantity);
            });

            remarkInputField.addEventListener('change', (e) => {
                const newRemark = e.target.value;
                updateMedicationRemark(medication, expiryDate, newRemark);
            });

            // 개별 삭제 이벤트 리스너 추가
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

        // 현재 날짜와 시간을 가져옴
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // 파일명 생성
        const filename = `약재DB_${year}${month}${day}${hours}${minutes}.xml`;

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // 생성된 파일명 사용
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
        medications = medications.filter(m => new Date(m.expiryDate) > now);
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    });

    // JSON 데이터를 XML로 변환하는 함수
    function jsonToXml(json) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<medications>\n';
        json.forEach(m => {
            xml += '  <medication>\n';
            xml += `    <name>${m.medication}</name>\n`;
            xml += `    <expiryDate>${m.expiryDate}</expiryDate>\n`;
            xml += `    <quantity>${m.quantity}</quantity>\n`;
            xml += `    <remark>${m.remark || ''}</remark>\n`;
            xml += '  </medication>\n';
        });
        xml += '</medications>';
        return xml;
    }

    // XML 데이터를 JSON으로 변환하는 함수
    function xmlToJson(xml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const medications = [];
        const medicationNodes = xmlDoc.getElementsByTagName('medication');
        Array.from(medicationNodes).forEach(node => {
            const medication = node.getElementsByTagName('name')[0].textContent;
            const expiryDate = node.getElementsByTagName('expiryDate')[0].textContent;
            const quantity = node.getElementsByTagName('quantity')[0].textContent;
            const remark = node.getElementsByTagName('remark')[0].textContent;
            medications.push({ medication, expiryDate, quantity, remark });
        });
        return medications;
    }

    // 로컬 스토리지에서 약제 데이터를 불러옴
    function loadMedications() {
        renderMedications();
    }
});

// 페이지 로드 시 저장된 각 메모 불러오기
window.addEventListener("DOMContentLoaded", () => {
    loadMemo("memo1");
    loadMemo("memo2");
});

// 메모 불러오기 함수 (각 메모창을 독립적으로 불러옴)
function loadMemo(memoId) {
    const savedMemo = localStorage.getItem(memoId);
    if (savedMemo) {
        document.getElementById(memoId).value = savedMemo;
    }
}

// 메모 저장 함수 (각 메모창을 독립적으로 저장)
function saveMemo(memoId) {
    const memoContent = document.getElementById(memoId).value;
    localStorage.setItem(memoId, memoContent);
    alert("메모가 저장되었습니다.");
}

// 메모 접기/펼치기 기능 (각 메모창을 독립적으로 접기/펼치기)
function toggleMemo(memoId, btnId) {
    const memoTextarea = document.getElementById(memoId);
    const toggleButton = document.getElementById(btnId);

    if (memoTextarea.style.display === "none" || memoTextarea.style.display === "") {
        memoTextarea.style.display = "block";
        toggleButton.innerText = "접기 ▲";
    } else {
        memoTextarea.style.display = "none";
        toggleButton.innerText = "펼치기 ▼";
    }
}


