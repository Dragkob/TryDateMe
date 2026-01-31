
document.addEventListener('DOMContentLoaded', () => {
  const dateContent = document.getElementById('date-content');
  const messageContent = document.getElementById('message-content');
  const settingsContent = document.getElementById('settings-content');
  const errorMessageDisplay = document.getElementById('error-message-display');
  const roomDetailsTable = document.querySelector('.room-details-table');
  const settingsIcon = document.getElementById('settings-icon');
  const settingsIconMsg = document.getElementById('settings-icon-msg');
  const backIcon = document.getElementById('back-icon');
  const githubLinkContainer = document.querySelector('.github-link-container');
  
  function showSettings() {
    dateContent.style.display = 'none';
    messageContent.style.display = 'none';
    settingsContent.style.display = 'block';
    githubLinkContainer.style.display = 'none';
    if (statusMessage) {
      statusMessage.className = 'status-message';
      statusMessage.textContent = '';
    }
  }
  
  function hideSettings() {
    settingsContent.style.display = 'none';
    githubLinkContainer.style.display = 'block';
    if (statusMessage) {
      statusMessage.className = 'status-message';
      statusMessage.textContent = '';
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const isTryHackMeRoom = currentTab.url && currentTab.url.startsWith("https://tryhackme.com/room/");
      
      if (isTryHackMeRoom) {
        dateContent.style.display = 'block';
        messageContent.style.display = 'none';
      } else {
        dateContent.style.display = 'none';
        messageContent.style.display = 'block';
      }
    });
  }
  
  if (settingsIcon) {
    settingsIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showSettings();
    });
  }
  
  if (settingsIconMsg) {
    settingsIconMsg.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showSettings();
    });
  }
  
  if (backIcon) {
    backIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideSettings();
    });
  }
  
  const cacheDurationInput = document.getElementById('cache-duration');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  
  chrome.storage.local.get(['cacheDurationDays'], (result) => {
    if (result.cacheDurationDays && cacheDurationInput) {
      cacheDurationInput.value = result.cacheDurationDays;
    } else if (cacheDurationInput) {
      cacheDurationInput.value = 1;
    }
  });
  
  if (cacheDurationInput) {
    cacheDurationInput.addEventListener('input', (e) => {
      let value = e.target.value;
      value = value.replace(/[^1-5]/g, '');
      if (value.length > 1) {
        value = value.slice(0, 1);
      }
      e.target.value = value;
    });
    
    cacheDurationInput.addEventListener('keypress', (e) => {
      const char = String.fromCharCode(e.which);
      if (!/[1-5]/.test(char)) {
        e.preventDefault();
      }
    });
    
    cacheDurationInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const filtered = paste.replace(/[^1-5]/g, '').slice(0, 1);
      if (filtered) {
        e.target.value = filtered;
      }
    });
  }
  
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const days = parseInt(cacheDurationInput.value, 10);
      
      if (isNaN(days) || days < 1 || days > 5) {
        statusMessage.textContent = 'Please enter a number between 1 and 5.';
        statusMessage.className = 'status-message error';
        return;
      }

      chrome.storage.local.set({ cacheDurationDays: days }, () => {
        statusMessage.textContent = 'Settings saved successfully!';
        statusMessage.className = 'status-message success';
        
        setTimeout(() => {
          statusMessage.className = 'status-message';
        }, 3000);
      });
    });
  }

  function formatIsoDate(isoString) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const isTryHackMeRoom = currentTab.url && currentTab.url.startsWith("https://tryhackme.com/room/");

    if (!isTryHackMeRoom) {
      if (settingsContent.style.display !== 'block') {
        dateContent.style.display = 'none';
        messageContent.style.display = 'block';
      }
      return;
    }

    if (settingsContent.style.display !== 'block') {
      dateContent.style.display = 'block';
      messageContent.style.display = 'none';
    }

    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['js/content.js']
    }, () => {
      chrome.tabs.sendMessage(currentTab.id, { action: "getRoomDates" }, (response) => {
        if (response && !response.error) {
          const roomNameElem = document.getElementById('roomName');
          const roomIDElem = document.getElementById('roomID');
          const roomCodeElem = document.getElementById('roomCode');
          const creationDateElem = document.getElementById('creationDate');
          const publishDateElem = document.getElementById('publishDate');

          if (roomNameElem) roomNameElem.textContent = response.title;
          if (roomIDElem) roomIDElem.textContent = response.id;
          if (roomCodeElem) roomCodeElem.textContent = response.code;
          if (creationDateElem) creationDateElem.textContent = formatIsoDate(response.created);
          if (publishDateElem) publishDateElem.textContent = formatIsoDate(response.published);

        } else {
          roomDetailsTable.style.display = 'none';
          errorMessageDisplay.textContent = response ? response.error : "Error loading room details. Make sure you are on a TryHackMe room page.";
          errorMessageDisplay.style.display = 'block';
          console.error("Error from content script:", response ? response.error : "No response or unknown error from content script.");
        }
      });
    });
  });
});
