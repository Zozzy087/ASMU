// flipbook-engine.ts - Főbb osztályok és funkciók

/**
 * Flipbook Motor - Interaktív kalandkönyvekhez
 * Támogatja a 100% PWA működést, lapozási animációkat, keresést, könyvjelzőt
 */

class FlipbookEngine {
  // DOM elemek
  private bookContainer: HTMLElement;
  private currentPageElement: HTMLIFrameElement | null = null;
  private nextPageElement: HTMLIFrameElement | null = null;
  private flipSound: HTMLAudioElement;
  
  // Állapot változók
  private currentPage: number = 0;
  private totalPages: number = 300;
  private isAnimating: boolean = false;
  private isMuted: boolean = false;
  
  // Navigáció vezérlők
  private leftButton: HTMLElement | null = null;
  private rightButton: HTMLElement | null = null;
  
  constructor(options: {
    containerId: string,
    totalPages: number,
    soundPath?: string
  }) {
    // Inicializálás az opciókkal
    this.totalPages = options.totalPages;
    
    const container = document.getElementById(options.containerId);
    if (!container) throw new Error(`Container element with ID "${options.containerId}" not found`);
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
  private initializeContainer(): void {
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
  private createControls(): void {
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
    controlsContainer.appendChild(fullscreenButton);
    controlsContainer.appendChild(muteButton);
    
    // Vezérlő konténer hozzáadása a könyv konténerhez
    document.body.appendChild(controlsContainer);
  }
  
  /**
   * Események hozzáadása
   */
  private addEventListeners(): void {
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
      } else if (e.key === 'ArrowRight') {
        this.nextPage();
      } else if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      }
    });
    
    // Érintés események (swipe)
    let touchStartX: number = 0;
    let touchEndX: number = 0;
    
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
  private handleSwipe(startX: number, endX: number): void {
    const swipeThreshold = 50;
    if (endX < startX - swipeThreshold) {
      // Jobbra swipe -> Következő oldal
      this.nextPage();
    } else if (endX > startX + swipeThreshold) {
      // Balra swipe -> Előző oldal
      this.prevPage();
    }
  }
  
  /**
   * Oldalbetöltés
   */
  private loadPage(pageNumber: number): void {
    if (pageNumber < 0 || pageNumber > this.totalPages) return;
    
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
  public nextPage(): void {
    if (this.isAnimating || this.currentPage >= this.totalPages) return;
    
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
  public prevPage(): void {
    if (this.isAnimating || this.currentPage <= 0) return;
    
    this.flipPageAnimation('left');
  }
  
  /**
   * Lapozási animáció végrehajtása
   */
  private flipPageAnimation(direction: 'left' | 'right'): void {
    if (!this.currentPageElement || !this.nextPageElement) return;
    
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
    } else {
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
      this.nextPageElement!.style.transition = 'transform 0.5s ease-in-out';
      this.currentPageElement!.style.transition = 'transform 0.5s ease-in-out';
      
      if (direction === 'right') {
        this.nextPageElement!.style.transform = 'translateX(0)';
        this.currentPageElement!.style.transform = 'translateX(-100%)';
      } else {
        this.nextPageElement!.style.transform = 'translateX(0)';
        this.currentPageElement!.style.transform = 'translateX(100%)';
      }
      
      // Animáció után iframeek cseréje
      setTimeout(() => {
        // A jelenlegi oldal iframe lesz a következő
        this.currentPageElement!.style.transition = '';
        this.nextPageElement!.style.transition = '';
        
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
  public saveBookmark(): void {
    localStorage.setItem('flipbook_bookmark', this.currentPage.toString());
    this.showNotification('Könyvjelző mentve: ' + this.currentPage + '. oldal');
  }
  
  /**
   * Könyvjelző betöltése
   */
  public loadBookmark(): void {
    const savedPage = localStorage.getItem('flipbook_bookmark');
    if (savedPage) {
      const pageNum = parseInt(savedPage, 10);
      if (!isNaN(pageNum) && pageNum >= 0 && pageNum <= this.totalPages) {
        this.loadPage(pageNum);
        this.showNotification('Könyvjelző betöltve: ' + pageNum + '. oldal');
      } else {
        this.showNotification('Érvénytelen könyvjelző!');
      }
    } else {
      this.showNotification('Nincs mentett könyvjelző!');
    }
  }
  
  /**
   * Navigációs gombok láthatóságának frissítése az aktuális oldal alapján
   */
  private updateNavigationVisibility(): void {
    const maxFreePageNavigation = 3; // Ezt állítsd be, ameddig a lapozás elérhető
    
    // Bal gomb frissítése (hátra lapozás)
    if (this.leftButton) {
      if (this.currentPage <= 0) {
        this.leftButton.style.opacity = '0.3';
        this.leftButton.style.pointerEvents = 'none';
      } else {
        this.leftButton.style.opacity = '1';
        this.leftButton.style.pointerEvents = 'auto';
      }
    }
    
    // Jobb gomb frissítése (előre lapozás)
    if (this.rightButton) {
      if (this.currentPage >= maxFreePageNavigation) {
        this.rightButton.style.opacity = '0.3';
        this.rightButton.style.pointerEvents = 'none';
      } else {
        this.rightButton.style.opacity = '1';
        this.rightButton.style.pointerEvents = 'auto';
      }
    }
  }
  
  /**
   * Értesítés megjelenítése
   */
  private showNotification(message: string): void {
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
   * Teljes képernyő váltás
   */
  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        this.showNotification('Teljes képernyő hiba: ' + err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
  
  /**
   * Hang némítása/visszakapcsolása
   */
  public toggleMute(button?: HTMLElement): void {
    this.isMuted = !this.isMuted;
    
    if (button) {
      button.innerHTML = this.isMuted ? '🔇' : '🔊';
    }
  }
  
  /**
   * Könyv bezárás, erőforrások felszabadítása
   */
  public destroy(): void {
    // Eseménykezelők eltávolítása
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.leftButton) {
      this.leftButton.removeEventListener('click', this.prevPage);
    }
    
    if (this.rightButton) {
      this.rightButton.removeEventListener('click', this.nextPage);
    }
  }
  
  // Segédfüggvény a keydown eseménykezelő referenciájához
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      this.prevPage();
    } else if (e.key === 'ArrowRight') {
      this.nextPage();
    }
  };
}

// Exportálás
(window as any).FlipbookEngine = FlipbookEngine;