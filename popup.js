document.addEventListener('DOMContentLoaded', () => {
    const directRadio = document.querySelector('input[value="direct"]');
    const injectRadio = document.querySelector('input[value="inject"]');
    const applyButton = document.getElementById('applyButton');
    const dropdownCheckbox = document.getElementById('dropdownCheckbox');
    const dropdownApplyButton = document.getElementById('dropdownApplyButton');
  
    // Load initial state from storage
    chrome.storage.sync.get(['queryMode', 'dropdownEnabled'], (data) => {
      if (data.queryMode === 'inject') {
        injectRadio.checked = true;
      } else {
        directRadio.checked = true;
      }
      dropdownCheckbox.checked = data.dropdownEnabled || false;
    });
  
    // Show Apply button when radio button changes
    [directRadio, injectRadio].forEach(radio => {
      radio.addEventListener('change', () => {
        applyButton.style.display = 'block';
      });
    });
  
    // Save the selected mode when Apply button is clicked
    applyButton.addEventListener('click', () => {
      const selectedMode = document.querySelector('input[name="queryMode"]:checked').value;
      chrome.storage.sync.set({ queryMode: selectedMode }, () => {
        applyButton.style.display = 'none';
      });
    });
  
    // Show Apply button when checkbox changes
    dropdownCheckbox.addEventListener('change', () => {
      dropdownApplyButton.style.display = 'block';
    });
  
    // Save the checkbox state when Apply button is clicked
    dropdownApplyButton.addEventListener('click', () => {
      chrome.storage.sync.set({ dropdownEnabled: dropdownCheckbox.checked }, () => {
        dropdownApplyButton.style.display = 'none';
      });
    });
  });