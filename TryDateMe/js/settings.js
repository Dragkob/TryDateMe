document.addEventListener('DOMContentLoaded', () => {
  const cacheDurationInput = document.getElementById('cache-duration');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  chrome.storage.local.get(['cacheDurationDays'], (result) => {
    if (result.cacheDurationDays) {
      cacheDurationInput.value = result.cacheDurationDays;
    } else {
      cacheDurationInput.value = 1;
    }
  });

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
});

