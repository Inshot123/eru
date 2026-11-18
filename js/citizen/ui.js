'use strict';
/* =====================================================================
   CITIZEN PAGE - UI: tabs, incident-type cards, chatbot suggestion chips
   ===================================================================== */
const TYPE_ICONS = { fire: '🔥', crime: '🚨', medical: '🚑', traffic: '🚗', disaster: '🌊' };

// Red/green message box under the form
function showMessage(text, kind) {            // kind = 'err' | 'good'
  $('#out').innerHTML = `<div class="msg ${kind}">${E(text)}</div>`;
}

const CitizenUI = {
  init() {
    this.fillTypeSelect();
    this.initTypeCards();
    this.initChatChips();
    initTabs((btn) => {
      if (btn.dataset.t === 'mine') MyReports.render(); else MapView.refresh();
    });
  },

  fillTypeSelect() {
    $('#type').innerHTML = Object.entries(TYPES)
      .map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
  },

  // Big clickable cards (Fire, Crime, ...) that set the "Incident type" field
  initTypeCards() {
    const box = $('#types'), select = $('#type');
    box.innerHTML = Object.entries(TYPES).map(([key, label]) =>
      `<button type="button" class="tcard" data-k="${key}"><span>${TYPE_ICONS[key]}</span>${label}</button>`).join('');

    const highlight = () => box.querySelectorAll('.tcard')
      .forEach((b) => b.classList.toggle('on', b.dataset.k === select.value));

    box.onclick = (e) => {
      const card = e.target.closest('.tcard');
      if (!card) return;
      select.value = card.dataset.k;
      highlight();
      $('#name').focus();
    };
    select.onchange = highlight;
    highlight();
  },

  // Suggestion buttons above the chat input
  initChatChips() {
    $$('.sug').forEach((chip) => chip.onclick = () => {
      $('#chatIn').value = chip.textContent.replace(/^\S+\s/, '');   // remove the emoji
      $('#chatForm').requestSubmit();
    });
  },
};
