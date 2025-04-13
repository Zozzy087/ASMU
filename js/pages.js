// js/page-config.js - Az összes oldal és interaktív elem konfigurációja

const pageImages = [
  'images/oldalak/borito.webp',
  'images/oldalak/elso-oldal.webp',
  'images/oldalak/masodik-oldal.webp',
  'images/oldalak/harmadik-oldal.webp',
  'images/oldalak/negyedik-oldal.webp',
  'images/oldalak/otodik-oldal.webp',
  // ... további oldalak itt ...
];

const pageConfig = {
  // 2. oldal - kattintható gomb
  'page2': {
    interactiveElements: [
      {
        type: 'button',
        position: { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' },
        text: 'KATTINTS RÁM!',
        action: 'alertMessage',
        data: 'Kattintottál az 2. oldal gombjára!'
      }
    ]
  },
  // 3. oldal - két választás
  'page3': {
    interactiveElements: [
      {
        type: 'button',
        position: { top: '60%', left: '50%', transform: 'translate(-50%, -50%)' },
        text: 'Első választás',
        action: 'gotoPage',
        data: 4
      },
      {
        type: 'button',
        position: { top: '75%', left: '50%', transform: 'translate(-50%, -50%)' },
        text: 'Második választás',
        action: 'gotoPage',
        data: 5
      }
    ]
  },
  // ... további oldalak itt ...
};

// Lehetséges akciók, amelyeket a gombokhoz rendelhetsz
const actions = {
  gotoPage: function(pageNum) {
    if (window.pageFlip) {
      window.pageFlip.flip(pageNum);
    }
  },
  alertMessage: function(message) {
    alert(message);
  },
  rollDice: function(options) {
    // Egyedi kockadobás, az oldalon megjelenítve
    const sides = options.sides || 6;
    const count = options.count || 1;
    const targetElement = document.getElementById(options.targetId);
    
    if (targetElement) {
      let results = [];
      for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
      }
      
      targetElement.textContent = `Dobás eredménye: ${results.join(', ')}`;
      
      // Opcionális callback függvény az eredménnyel
      if (options.callback) {
        actions[options.callback](results);
      }
    }
  },
  // ... további akciók itt ...
};