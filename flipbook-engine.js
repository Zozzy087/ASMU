// flipbook-engine.ts - Főbb osztályok és funkciók
/**
 * Flipbook Motor - Interaktív kalandkönyvekhez
 * Támogatja a 100% PWA működést, lapozási animációkat, keresést, könyvjelzőt
 */
class FlipbookEngine {
    constructor(options) {
        this.currentPageElement = null;
        this.nextPageElement = null;
        // Állapot változók
        this.currentPage = 0;
        this.totalPages = 300;
        this.isAnimating = false;
        this.isZoomed = false;
        this.zoomLevel = 1.0;
        this.isMuted = false;
        // Navigáció vezérlők
        this.leftButton = null;
        this.rightButton = null;
        /**
         * Pásztázás letiltása
         */
        this.panZoomListeners = null;
        // Segédfüggvény a keydown eseménykezelő referenciájához
        this.handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevPage();
            }
            else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
        };
        // Inicializálás az opciókkal
        this.totalPages = options.totalPages;
        const container = document.getElementById(options.containerId);
        if (!container)
            throw new Error(`Container element with ID "${options.containerId}" not found`);
        this.bookContainer = container;
        // Flipbook konténer inicializálása
        this.initializeContainer();
        // Lapozó hang inicializálása
        this.flipSound = new Audio(options.soundPath || 'sounds/pageturn.mp3');
        // Vezérlők létrehozása
        this.createControls();
        // Események hozzáadása
        this.addEventListeners();
        // Kezdőoldal betöltése
        this.loadPage(0);
        // Navigációs gombok kezdeti beállítása
        this.updateNavigationVisibility();
    }
    /**
     * Flipbook konténer inicializálása
     */
    initializeContainer() {
        this.bookContainer.innerHTML = '';
        this.bookContainer.style.position = 'relative';
        this.bookContainer.style.width = '100%';
        this.bookContainer.style.height = '100%';
        this.bookContainer.style.overflow = 'hidden';
        this.bookContainer.classList.add('flipbook-container');
        // Aktuális oldal iframe létrehozása
        this.currentPageElement = document.createElement('iframe');
        this.currentPageElement.className = 'book-page current';
        this.currentPageElement.style.width = '100%';
        this.currentPageElement.style.height = '100%';
        this.currentPageElement.style.border = 'none';
        this.currentPageElement.style.position = 'absolute';
        this.currentPageElement.style.left = '0';
        this.currentPageElement.style.top = '0';
        this.currentPageElement.style.zIndex = '1';
        this.bookContainer.appendChild(this.currentPageElement);
        // Következő oldal iframe elékészítése (lapozáshoz)
        this.nextPageElement = document.createElement('iframe');
        this.nextPageElement.className = 'book-page next';
        this.nextPageElement.style.width = '100%';
        this.nextPageElement.style.height = '100%';
        this.nextPageElement.style.border = 'none';
        this.nextPageElement.style.position = 'absolute';
        this.nextPageElement.style.left = '0';
        this.nextPageElement.style.top = '0';
        this.nextPageElement.style.zIndex = '0';
        this.nextPageElement.style.visibility = 'hidden';
        this.bookContainer.appendChild(this.nextPageElement);
    }
    /**
     * Navigációs és funkció vezérlők létrehozása
     */
    createControls() {
        // Baloldali lapozó gomb
        this.leftButton = document.createElement('div');
        this.leftButton.className = 'page-turn-button left';
        this.leftButton.innerHTML = '◀';
        this.leftButton.style.position = 'absolute';
        this.leftButton.style.left = '20px';
        this.leftButton.style.top = '50%';
        this.leftButton.style.transform = 'translateY(-50%)';
        this.leftButton.style.fontSize = '36px';
        this.leftButton.style.color = 'rgba(255, 255, 255, 0.7)';
        this.leftButton.style.cursor = 'pointer';
        this.leftButton.style.zIndex = '100';
        this.leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.leftButton.style.borderRadius = '50%';
        this.leftButton.style.width = '50px';
        this.leftButton.style.height = '50px';
        this.leftButton.style.display = 'flex';
        this.leftButton.style.justifyContent = 'center';
        this.leftButton.style.alignItems = 'center';
        this.leftButton.style.transition = 'opacity 0.3s ease';
        this.bookContainer.appendChild(this.leftButton);
        // Jobboldali lapozó gomb
        this.rightButton = document.createElement('div');
        this.rightButton.className = 'page-turn-button right';
        this.rightButton.innerHTML = '▶';
        this.rightButton.style.position = 'absolute';
        this.rightButton.style.right = '20px';
        this.rightButton.style.top = '50%';
        this.rightButton.style.transform = 'translateY(-50%)';
        this.rightButton.style.fontSize = '36px';
        this.rightButton.style.color = 'rgba(255, 255, 255, 0.7)';
        this.rightButton.style.cursor = 'pointer';
        this.rightButton.style.zIndex = '100';
        this.rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.rightButton.style.borderRadius = '50%';
        this.rightButton.style.width = '50px';
        this.rightButton.style.height = '50px';
        this.rightButton.style.display = 'flex';
        this.rightButton.style.justifyContent = 'center';
        this.rightButton.style.alignItems = 'center';
        this.rightButton.style.transition = 'opacity 0.3s ease';
        this.bookContainer.appendChild(this.rightButton);
        // További vezérlők konténere
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.left = '50%';
        controlsContainer.style.transform = 'translateX(-50%)';
        controlsContainer.style.zIndex = '100';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.gap = '10px';
        controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.borderRadius = '20px';
        // Könyvjelző mentés gomb
        const saveButton = document.createElement('button');
        saveButton.className = 'control-button save';
        saveButton.innerHTML = '🔖';
        saveButton.style.width = '40px';
        saveButton.style.height = '40px';
        saveButton.style.borderRadius = '50%';
        saveButton.style.border = 'none';
        saveButton.style.backgroundColor = '#7f00ff';
        saveButton.style.color = 'white';
        saveButton.style.fontSize = '20px';
        saveButton.style.cursor = 'pointer';
        saveButton.title = 'Könyvjelző mentése';
        saveButton.addEventListener('click', () => this.saveBookmark());
        // Könyvjelző betöltés gomb
        const loadButton = document.createElement('button');
        loadButton.className = 'control-button load';
        loadButton.innerHTML = '📑';
        loadButton.style.width = '40px';
        loadButton.style.height = '40px';
        loadButton.style.borderRadius = '50%';
        loadButton.style.border = 'none';
        loadButton.style.backgroundColor = '#7f00ff';
        loadButton.style.color = 'white';
        loadButton.style.fontSize = '20px';
        loadButton.style.cursor = 'pointer';
        loadButton.title = 'Könyvjelző betöltése';
        loadButton.addEventListener('click', () => this.loadBookmark());
        // Zoom gomb
        const zoomButton = document.createElement('button');
        zoomButton.className = 'control-button zoom';
        zoomButton.innerHTML = '🔍';
        zoomButton.style.width = '40px';
        zoomButton.style.height = '40px';
        zoomButton.style.borderRadius = '50%';
        zoomButton.style.border = 'none';
        zoomButton.style.backgroundColor = '#7f00ff';
        zoomButton.style.color = 'white';
        zoomButton.style.fontSize = '20px';
        zoomButton.style.cursor = 'pointer';
        zoomButton.title = 'Nagyítás';
        zoomButton.addEventListener('click', () => this.toggleZoom());
        // Teljes képernyő gomb
        const fullscreenButton = document.createElement('button');
        fullscreenButton.className = 'control-button fullscreen';
        fullscreenButton.innerHTML = '⛶';
        fullscreenButton.style.width = '40px';
        fullscreenButton.style.height = '40px';
        fullscreenButton.style.borderRadius = '50%';
        fullscreenButton.style.border = 'none';
        fullscreenButton.style.backgroundColor = '#7f00ff';
        fullscreenButton.style.color = 'white';
        fullscreenButton.style.fontSize = '20px';
        fullscreenButton.style.cursor = 'pointer';
        fullscreenButton.title = 'Teljes képernyő';
        fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        // Némítás gomb
        const muteButton = document.createElement('button');
        muteButton.className = 'control-button mute';
        muteButton.innerHTML = '🔊';
        muteButton.style.width = '40px';
        muteButton.style.height = '40px';
        muteButton.style.borderRadius = '50%';
        muteButton.style.border = 'none';
        muteButton.style.backgroundColor = '#7f00ff';
        muteButton.style.color = 'white';
        muteButton.style.fontSize = '20px';
        muteButton.style.cursor = 'pointer';
        muteButton.title = 'Hang némítása';
        muteButton.addEventListener('click', () => this.toggleMute(muteButton));
        // Gombok hozzáadása a vezérlő konténerhez
        controlsContainer.appendChild(saveButton);
        controlsContainer.appendChild(loadButton);
        controlsContainer.appendChild(zoomButton);
        controlsContainer.appendChild(fullscreenButton);
        controlsContainer.appendChild(muteButton);
        // Vezérlő konténer hozzáadása a könyv konténerhez
        document.body.appendChild(controlsContainer);
    }
    /**
     * Események hozzáadása
     */
    addEventListeners() {
        // Nyíl gombok eseménykezelői
        if (this.leftButton) {
            this.leftButton.addEventListener('click', () => this.prevPage());
        }
        if (this.rightButton) {
            this.rightButton.addEventListener('click', () => this.nextPage());
        }
        // Billentyűzet események
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevPage();
            }
            else if (e.key === 'ArrowRight') {
                this.nextPage();
            }
            else if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
            else if (e.key === 'z' || e.key === 'Z') {
                this.toggleZoom();
            }
        });
        // Érintés események (swipe)
        let touchStartX = 0;
        let touchEndX = 0;
        this.bookContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        this.bookContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    /**
     * Swipe kezelése
     */
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        if (endX < startX - swipeThreshold) {
            // Jobbra swipe -> Következő oldal
            this.nextPage();
        }
        else if (endX > startX + swipeThreshold) {
            // Balra swipe -> Előző oldal
            this.prevPage();
        }
    }
    /**
     * Oldalbetöltés
     */
    loadPage(pageNumber) {
        if (pageNumber < 0 || pageNumber > this.totalPages)
            return;
        if (this.currentPageElement) {
            const pagePath = pageNumber === 0 ? 'pages/borito.html' : `pages/${pageNumber}.html`;
            this.currentPageElement.src = pagePath;
            this.currentPage = pageNumber;
            // Navigációs gombok frissítése
            this.updateNavigationVisibility();
        }
    }
    /**
     * Következő oldalra lapozás
     */
    nextPage() {
        if (this.isAnimating || this.currentPage >= this.totalPages)
            return;
        // Csak bizonyos oldalszámig engedélyezünk lapozást
        const maxFreePageNavigation = 3; // Ezt az értéket állítsd be, ameddig lapozni lehet
        if (this.currentPage >= maxFreePageNavigation) {
            this.showNotification('Ezen a ponton csak linkeken keresztül folytathatod az olvasást.');
            return;
        }
        this.flipPageAnimation('right');
    }
    /**
     * Előző oldalra lapozás
     */
    prevPage() {
        if (this.isAnimating || this.currentPage <= 0)
            return;
        this.flipPageAnimation('left');
    }
    /**
     * Lapozási animáció végrehajtása
     */
    flipPageAnimation(direction) {
        if (!this.currentPageElement || !this.nextPageElement)
            return;
        this.isAnimating = true;
        // Kövezkező oldal számának kiszámítása
        const nextPageNum = direction === 'right' ? this.currentPage + 1 : this.currentPage - 1;
        if (nextPageNum < 0 || nextPageNum > this.totalPages) {
            this.isAnimating = false;
            return;
        }
        // Következő oldal betöltése az elrejtett iframe-be
        const nextPagePath = nextPageNum === 0 ? 'pages/borito.html' : `pages/${nextPageNum}.html`;
        this.nextPageElement.src = nextPagePath;
        this.nextPageElement.style.visibility = 'visible';
        // A lap helyzetének beállítása az animációhoz
        if (direction === 'right') {
            // Jobbra lapozás esetén
            this.nextPageElement.style.transform = 'translateX(100%)';
            this.currentPageElement.style.transform = 'translateX(0)';
        }
        else {
            // Balra lapozás esetén
            this.nextPageElement.style.transform = 'translateX(-100%)';
            this.currentPageElement.style.transform = 'translateX(0)';
        }
        // Rövid várakozás, hogy az új oldal betöltődjön
        setTimeout(() => {
            // Lapozás hang lejátszása
            if (!this.isMuted) {
                this.flipSound.currentTime = 0;
                this.flipSound.play().catch(e => console.error('Hang lejátszási hiba:', e));
            }
            // Animáció hozzáadása
            this.nextPageElement.style.transition = 'transform 0.5s ease-in-out';
            this.currentPageElement.style.transition = 'transform 0.5s ease-in-out';
            if (direction === 'right') {
                this.nextPageElement.style.transform = 'translateX(0)';
                this.currentPageElement.style.transform = 'translateX(-100%)';
            }
            else {
                this.nextPageElement.style.transform = 'translateX(0)';
                this.currentPageElement.style.transform = 'translateX(100%)';
            }
            // Animáció után iframeek cseréje
            setTimeout(() => {
                // A jelenlegi oldal iframe lesz a következő
                this.currentPageElement.style.transition = '';
                this.nextPageElement.style.transition = '';
                // Ideiglenes változó a cseréhez
                const temp = this.currentPageElement;
                this.currentPageElement = this.nextPageElement;
                this.nextPageElement = temp;
                // Z-index és láthatóság alaphelyzetbe állítása
                this.currentPageElement.style.zIndex = '1';
                this.nextPageElement.style.zIndex = '0';
                this.nextPageElement.style.visibility = 'hidden';
                this.nextPageElement.style.transform = 'translateX(0)';
                // Oldal számának frissítése
                this.currentPage = nextPageNum;
                // Navigációs gombok frissítése
                this.updateNavigationVisibility();
                // Animáció befejezve
                this.isAnimating = false;
            }, 500); // Animáció ideje
        }, 50);
    }
    /**
     * Könyvjelző mentése
     */
    saveBookmark() {
        localStorage.setItem('flipbook_bookmark', this.currentPage.toString());
        this.showNotification('Könyvjelző mentve: ' + this.currentPage + '. oldal');
    }
    /**
     * Könyvjelző betöltése
     */
    loadBookmark() {
        const savedPage = localStorage.getItem('flipbook_bookmark');
        if (savedPage) {
            const pageNum = parseInt(savedPage, 10);
            if (!isNaN(pageNum) && pageNum >= 0 && pageNum <= this.totalPages) {
                this.loadPage(pageNum);
                this.showNotification('Könyvjelző betöltve: ' + pageNum + '. oldal');
            }
            else {
                this.showNotification('Érvénytelen könyvjelző!');
            }
        }
        else {
            this.showNotification('Nincs mentett könyvjelző!');
        }
    }
    /**
     * Navigációs gombok láthatóságának frissítése az aktuális oldal alapján
     */
    updateNavigationVisibility() {
        const maxFreePageNavigation = 3; // Ezt állítsd be, ameddig a lapozás elérhető
        // Bal gomb frissítése (hátra lapozás)
        if (this.leftButton) {
            if (this.currentPage <= 0) {
                this.leftButton.style.opacity = '0.3';
                this.leftButton.style.pointerEvents = 'none';
            }
            else {
                this.leftButton.style.opacity = '1';
                this.leftButton.style.pointerEvents = 'auto';
            }
        }
        // Jobb gomb frissítése (előre lapozás)
        if (this.rightButton) {
            if (this.currentPage >= maxFreePageNavigation) {
                this.rightButton.style.opacity = '0.3';
                this.rightButton.style.pointerEvents = 'none';
            }
            else {
                this.rightButton.style.opacity = '1';
                this.rightButton.style.pointerEvents = 'auto';
            }
        }
    }
    /**
     * Értesítés megjelenítése
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'flipbook-notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(notification);
        // Megjelenítés fokozatosan
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        // Eltüntetés késleltetéssel
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    /**
     * Nagyítás be/ki kapcsolása
     */
    toggleZoom() {
        if (!this.currentPageElement)
            return;
        this.isZoomed = !this.isZoomed;
        if (this.isZoomed) {
            this.zoomLevel = 1.5;
            this.currentPageElement.style.transform = `scale(${this.zoomLevel})`;
            this.enablePanZoom();
        }
        else {
            this.zoomLevel = 1.0;
            this.currentPageElement.style.transform = 'scale(1)';
            this.disablePanZoom();
        }
    }
    /**
     * Nagyítás esetén pásztázás engedélyezése
     */
    enablePanZoom() {
        if (!this.currentPageElement)
            return;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        const iframe = this.currentPageElement;
        const startDrag = (e) => {
            isDragging = true;
            if (e instanceof MouseEvent) {
                startX = e.clientX;
                startY = e.clientY;
            }
            else {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
            // Aktuális transform értékek kinyerése
            const transformValue = iframe.style.transform;
            const translateMatch = transformValue.match(/translate\((-?\d+(\.\d+)?)px, (-?\d+(\.\d+)?)px\)/);
            if (translateMatch) {
                currentX = parseFloat(translateMatch[1]);
                currentY = parseFloat(translateMatch[3]);
            }
            else {
                currentX = 0;
                currentY = 0;
            }
        };
        const drag = (e) => {
            if (!isDragging)
                return;
            let clientX, clientY;
            if (e instanceof MouseEvent) {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const newX = currentX + deltaX;
            const newY = currentY + deltaY;
            iframe.style.transform = `scale(${this.zoomLevel}) translate(${newX}px, ${newY}px)`;
        };
        const endDrag = () => {
            isDragging = false;
        };
        iframe.addEventListener('mousedown', startDrag);
        iframe.addEventListener('touchstart', startDrag);
        window.addEventListener('mousemove', drag);
        window.addEventListener('touchmove', drag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
        // Ezeket a referenciákat később felhasználjuk az események eltávolításához
        this.panZoomListeners = {
            startDrag,
            drag,
            endDrag
        };
    }
    disablePanZoom() {
        if (!this.currentPageElement || !this.panZoomListeners)
            return;
        const iframe = this.currentPageElement;
        iframe.removeEventListener('mousedown', this.panZoomListeners.startDrag);
        iframe.removeEventListener('touchstart', this.panZoomListeners.startDrag);
        window.removeEventListener('mousemove', this.panZoomListeners.drag);
        window.removeEventListener('touchmove', this.panZoomListeners.drag);
        window.removeEventListener('mouseup', this.panZoomListeners.endDrag);
        window.removeEventListener('touchend', this.panZoomListeners.endDrag);
        iframe.style.transform = 'scale(1)';
    }
    /**
     * Teljes képernyő váltás
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showNotification('Teljes képernyő hiba: ' + err.message);
            });
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    /**
     * Hang némítása/visszakapcsolása
     */
    toggleMute(button) {
        this.isMuted = !this.isMuted;
        if (button) {
            button.innerHTML = this.isMuted ? '🔇' : '🔊';
        }
    }
    /**
     * Oldal keresési funkció
     */
    search(query) {
        // TODO: Keresési logika implementálása
        // (Ez összetettebb téma, mivel az iframe-ek tartalma elkülönül)
    }
    /**
     * Könyv bezárás, erőforrások felszabadítása
     */
    destroy() {
        // Eseménykezelők eltávolítása
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.leftButton) {
            this.leftButton.removeEventListener('click', this.prevPage);
        }
        if (this.rightButton) {
            this.rightButton.removeEventListener('click', this.nextPage);
        }
        // Nagyítás eseménykezelők eltávolítása
        this.disablePanZoom();
    }
}
/**
 * Kockadobó osztály
 */
class DiceRoller {
    constructor(container) {
        this.results = [];
        this.diceImages = {
            1: 'images/d1.png',
            2: 'images/d2.png',
            3: 'images/d3.png',
            4: 'images/d4.png',
            5: 'images/d5.png',
            6: 'images/d6.png'
        };
        this.container = container;
    }
    /**
     * Kockák dobása
     */
    roll(numDice = 3, successValue = 4) {
        this.results = [];
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            this.results.push({
                value: roll,
                isSuccess: roll >= successValue
            });
        }
        return this.results;
    }
    /**
     * Kockák megjelenítése
     */
    renderDice() {
        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-results';
        diceContainer.style.display = 'flex';
        diceContainer.style.justifyContent = 'center';
        diceContainer.style.gap = '10px';
        diceContainer.style.marginTop = '20px';
        this.results.forEach(result => {
            const img = document.createElement('img');
            img.src = this.diceImages[result.value];
            img.alt = `Kocka: ${result.value}`;
            img.style.width = '80px';
            img.style.height = '80px';
            // Sikeres dobás esetén zöld keret
            if (result.isSuccess) {
                img.style.border = '2px solid #00ff00';
                img.style.borderRadius = '10px';
            }
            diceContainer.appendChild(img);
        });
        // Régi eredmények törlése és újak hozzáadása
        const oldContainer = this.container.querySelector('.dice-results');
        if (oldContainer) {
            this.container.removeChild(oldContainer);
        }
        this.container.appendChild(diceContainer);
        // Sikerek számának megjelenítése harci dobás esetén
        if (this.results.length === 3) {
            const successCount = this.results.filter(r => r.isSuccess).length;
            let successText = '';
            switch (successCount) {
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
            const successElement = document.createElement('div');
            successElement.id = 'success-results';
            successElement.style.background = 'black';
            successElement.style.color = 'white';
            successElement.style.display = 'inline-block';
            successElement.style.padding = '5px 10px';
            successElement.style.borderRadius = '5px';
            successElement.style.marginTop = '10px';
            successElement.style.fontSize = '1.2rem';
            successElement.textContent = successText;
            // Régi eredmény eltávolítása ha létezik
            const oldSuccess = this.container.querySelector('#success-results');
            if (oldSuccess) {
                this.container.removeChild(oldSuccess);
            }
            this.container.appendChild(successElement);
        }
    }
    /**
     * Sikerek számának lekérdezése
     */
    getSuccessCount() {
        return this.results.filter(r => r.isSuccess).length;
    }
}
/**
 * Kockadobó Widget interfész
 */
class DiceWidget {
    constructor(options) {
        this.isVisible = false;
        const container = document.getElementById(options.containerId);
        if (!container)
            throw new Error(`Container with ID "${options.containerId}" not found`);
        this.container = container;
        this.numDice = options.numDice;
        this.diceRoller = new DiceRoller(container);
        this.initializeUI(options.title, options.buttonText || 'Dobás');
    }
    /**
     * UI inicializálása
     */
    initializeUI(title, buttonText) {
        this.container.innerHTML = '';
        this.container.style.display = 'none';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '1000';
        this.container.style.background = 'rgba(0, 0, 0, 0.8)';
        this.container.style.borderRadius = '10px';
        this.container.style.padding = '10px';
        this.container.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
        // Widget tartalom létrehozása
        const content = document.createElement('div');
        content.style.textAlign = 'center';
        content.style.marginTop = '20px';
        // Cím
        const titleElement = document.createElement('h3');
        titleElement.className = 'dice-title';
        titleElement.textContent = title;
        titleElement.style.fontFamily = "'Cinzel', serif";
        titleElement.style.color = 'white';
        titleElement.style.background = 'black';
        titleElement.style.display = 'inline-block';
        titleElement.style.padding = '10px';
        titleElement.style.borderRadius = '5px';
        titleElement.style.textAlign = 'center';
        titleElement.style.marginBottom = '10px';
        // Dobás gomb
        const button = document.createElement('button');
        button.className = 'dice-button';
        button.textContent = buttonText;
        button.style.padding = '10px 20px';
        button.style.marginTop = '10px';
        button.style.background = '#7f00ff';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.fontSize = '1.1rem';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 0 10px rgba(127, 0, 255, 0.5)';
        button.addEventListener('click', () => this.rollDice());
        // Elemek hozzáadása
        content.appendChild(titleElement);
        content.appendChild(document.createElement('br'));
        content.appendChild(button);
        this.container.appendChild(content);
    }
    /**
     * Kockadobás
     */
    rollDice() {
        this.diceRoller.roll(this.numDice);
        this.diceRoller.renderDice();
    }
    /**
     * Widget megjelenítése/elrejtése
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    /**
     * Widget elrejtése
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
}
/**
 * Exportálás
 */
window.FlipbookEngine = FlipbookEngine;
window.DiceRoller = DiceRoller;
window.DiceWidget = DiceWidget;
