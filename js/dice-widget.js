
function showDiceRoll() {
    const container = document.getElementById("dice-widget-container");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; margin-top:20px;">
            <h3 style="font-family:'Cinzel', serif; color:white; background:black; display:inline-block; padding:10px; border-radius:5px;">
                Harci Kockadobás
            </h3>
            <br>
            <button onclick="rollDice()" style="padding:10px 20px; margin-top:10px; background:#7f00ff; color:white; border:none; border-radius:5px; font-size:1.1rem; cursor:pointer;">
                Dobás
            </button>
            <div class="dice-results" id="dice-images" style="display:flex; justify-content:center; gap:10px; margin-top:20px;"></div>
            <div id="success-results" style="background:black; color:white; display:inline-block; padding:5px 10px; border-radius:5px; margin-top:10px; font-size:1.2rem;"></div>
        </div>
    `;
}

function rollDice() {
    const diceImages = {
        1: 'images/d1.png',
        2: 'images/d2.png',
        3: 'images/d3.png',
        4: 'images/d4.png',
        5: 'images/d5.png',
        6: 'images/d6.png'
    };

    const diceContainer = document.getElementById('dice-images');
    const successResults = document.getElementById('success-results');
    diceContainer.innerHTML = '';

    let successes = 0;

    for (let i = 0; i < 3; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        const img = document.createElement('img');
        img.src = diceImages[roll];
        img.alt = `Kocka: ${roll}`;
        img.style.width = '80px';
        img.style.height = '80px';
        diceContainer.appendChild(img);

        if (roll >= 4) {
            successes++;
        }
    }

    let successText = '';
    switch (successes) {
        case 0:
            successText = 'Nincs Siker';
            break;
        case 1:
            successText = 'Egy Siker';
            break;
        case 2:
            successText = 'Két Siker';
            break;
        case 3:
            successText = 'Három Siker';
            break;
    }

    successResults.textContent = successText;
}
