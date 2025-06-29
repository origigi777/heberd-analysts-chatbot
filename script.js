let csvFileInput, statusDisplay, chatbox, userMessageInput, sendButton,
    apiKeyStatus, apiKeyLoadingBar, fileLoadingBar;

let isModelReady = true;  // המודל תמיד מוכן כי השרת הלוקאלי רץ
let isDataLoaded = false;  // לפני טעינת CSV

document.addEventListener('DOMContentLoaded', () => {
    csvFileInput = document.getElementById('csvFile');
    statusDisplay = document.getElementById('status');
    chatbox = document.getElementById('chatbox');
    userMessageInput = document.getElementById('userMessage');
    sendButton = document.getElementById('sendButton');
    apiKeyStatus = document.getElementById('apiKeyStatus');
    apiKeyLoadingBar = document.getElementById('apiKeyLoadingBar');
    fileLoadingBar = document.getElementById('fileLoadingBar');

    if (csvFileInput) csvFileInput.addEventListener('change', handleFileUpload);
    if (sendButton && userMessageInput) {
        sendButton.addEventListener('click', handleSendMessage);
        userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendButton.disabled) handleSendMessage();
        });
    }

    updateStatusText(apiKeyStatus, "המודל המקומי זמין ומוכן.", "success");
    hideLoadingBar(apiKeyLoadingBar);
    checkEnableSend();
});

function updateStatusText(element, message, type = 'info') {
    if (element) {
        element.textContent = message;
        element.className = `status-${type}`;
    }
}
function showLoadingBar(barElement) { if (barElement) barElement.style.display = 'block'; }
function hideLoadingBar(barElement) { if (barElement) barElement.style.display = 'none'; }

function checkEnableSend() {
    const enabled = isModelReady && isDataLoaded;
    if (userMessageInput) userMessageInput.disabled = !enabled;
    if (sendButton) sendButton.disabled = !enabled;
    if (userMessageInput) {
        if (enabled) userMessageInput.placeholder = "שאל אותי על נתוני ה-CSV...";
        else if (!isModelReady) userMessageInput.placeholder = "המודל לא מוכן...";
        else userMessageInput.placeholder = "אנא טען קובץ CSV...";
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    isDataLoaded = false;
    checkEnableSend();

    if (!file) {
        updateStatusText(statusDisplay, "לא נבחר קובץ.", "error");
        return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
        updateStatusText(statusDisplay, "אנא טען קובץ CSV בלבד.", "error");
        csvFileInput.value = '';
        return;
    }

    updateStatusText(statusDisplay, `טוען את הקובץ: ${file.name}...`, "loading");
    showLoadingBar(fileLoadingBar);
    if (chatbox) chatbox.innerHTML = '';

    try {
        const res = await uploadCsvFile(file);
        updateStatusText(statusDisplay, `הקובץ נטען בהצלחה! ${res.message}`, "success");
        isDataLoaded = true;
        addMessage({ textResponse: `הקובץ נטען למודל בהצלחה.` }, 'bot');
    } catch (err) {
        updateStatusText(statusDisplay, `שגיאה בטעינת הקובץ: ${err.message}`, "error");
    } finally {
        hideLoadingBar(fileLoadingBar);
        checkEnableSend();
    }
}

async function uploadCsvFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8080/upload_csv', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error: ${response.status} ${errText}`);
    }

    return await response.json();
}

async function handleSendMessage() {
    const messageText = userMessageInput.value.trim();
    if (!messageText || !isModelReady || !isDataLoaded) return;

    addMessage({ textResponse: messageText }, 'user');
    userMessageInput.value = '';
    userMessageInput.disabled = true;
    sendButton.disabled = true;

    const thinking = addMessage({ textResponse: "מעבד בקשה..." }, 'bot');
    if (thinking) thinking.classList.add('thinking');

    try {
        const responseData = await getChatResponse(messageText);
        if (chatbox && thinking && chatbox.contains(thinking)) chatbox.removeChild(thinking);

        // הצגת טקסט כללי אם קיים
        if (responseData.message) {
            addMessage({ textResponse: responseData.message }, 'bot');
        }

        // הצגת כל השורות הרלוונטיות (אם יש)
        if (responseData.relevant_rows && Array.isArray(responseData.relevant_rows)) {
            responseData.relevant_rows.forEach((row, idx) => {
                const formattedRow = formatCSVRow(row);
                addMessage({ textResponse: `🔹 תוצאה ${idx + 1}:\n${formattedRow}` }, 'bot');
            });
        }

        // fallback: הצגת תשובה רגילה אם קיימת ואינה כוללת את הפורמטים שלמעלה
        if (responseData.textResponse && !responseData.relevant_rows && !responseData.message) {
            addMessage({ textResponse: responseData.textResponse }, 'bot');
        }
    } catch (error) {
        if (chatbox && thinking && chatbox.contains(thinking)) chatbox.removeChild(thinking);
        addMessage({ textResponse: `שגיאה בתקשורת עם השרת: ${error.message}` }, 'bot');
    } finally {
        checkEnableSend();
    }
}

async function getChatResponse(query) {
    const response = await fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error: ${response.status} ${errText}`);
    }

    return await response.json();
}

function addMessage(response, sender = 'bot') {
    if (!chatbox) return null;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    if (response.textResponse) {
        const text = document.createElement('div');
        text.textContent = response.textResponse;
        messageDiv.appendChild(text);
    }

    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
    return messageDiv;
}

function formatCSVRow(rowObj) {
    return Object.entries(rowObj)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
}
