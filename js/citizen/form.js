'use strict';
/* =====================================================================
   CITIZEN PAGE - REPORT FORM  (validation + sending the report)
   ===================================================================== */
const ReportForm = {
  validate() {
    if (ERU.clean($('#name').value, 60).length < 2) {
      showMessage('Please enter the reporter name.', 'err'); return false;
    }
    if (!/^\d{11}$/.test($('#phone').value)) {                 // exactly 11 digits
      showMessage('Mobile number must be exactly 11 digits.', 'err'); return false;
    }
    return true;
  },

  async submit() {
    if (!this.validate()) return;
    const pos = MapView.getPosition();
    if (!pos) { showMessage('Please set your location first.', 'err'); return; }

    let exactAddr = ERU.clean($('#addr').value, 120);
    if (!exactAddr) {
      exactAddr = ERU.clean(await MapView.resolveNow(), 120);
    }

    try {
      const r = await ERU.api('report', {
        a: 'submit',
        name:  ERU.clean($('#name').value, 60),
        phone: $('#phone').value,
        type:  $('#type').value,
        desc:  $('#desc').value,
        addr:  exactAddr,
        lat: pos.lat, lng: pos.lng, acc: pos.acc,
      });
      MyReports.remember(r.ref);
      const where = exactAddr ? ` (${exactAddr})` : '';
      showMessage(`Report sent! Reference ${r.ref}${where}. Nearest station: ${r.city}. Stay safe and keep your phone on.`, 'good');
    } catch (e) {
      showMessage(e.message, 'err');
    }
  },

  init() {
    // Phone box accepts digits only, max 11
    $('#phone').oninput = (e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);

    $('#loc').onclick   = () => MapView.toggleTracking();
    $('#send').onclick  = () => this.submit();
    // Quick Send: take a fresh GPS reading, then send immediately
    $('#quick').onclick = () => { if (this.validate()) MapView.getFreshFix(() => this.submit()); };
  },
};