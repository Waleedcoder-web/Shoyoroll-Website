// BLUENEEDLE - Admin Panel Interactive Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar / Nav Toggle
  const adminMenuBtn = document.querySelector('[data-admin-menu-toggle]');
  const adminMobileNav = document.querySelector('[data-admin-mobile-nav]');
  if (adminMenuBtn && adminMobileNav) {
    adminMenuBtn.addEventListener('click', () => {
      adminMobileNav.classList.toggle('hidden');
    });
  }

  // 2. Settings Tabs
  const tabTriggers = document.querySelectorAll('[data-tab-trigger]');
  const tabPanels = document.querySelectorAll('[data-tab-panel]');

  if (tabTriggers.length > 0 && tabPanels.length > 0) {
    tabTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const target = trigger.getAttribute('data-tab-trigger');
        
        tabTriggers.forEach((t) => {
          t.classList.remove('bg-background', 'text-foreground', 'shadow-xs');
          t.classList.add('text-muted-foreground');
        });
        trigger.classList.add('bg-background', 'text-foreground', 'shadow-xs');
        trigger.classList.remove('text-muted-foreground');

        tabPanels.forEach((panel) => {
          if (panel.getAttribute('data-tab-panel') === target) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });
      });
    });
  }

  // 3. Inquiries Filter & Search & Modal
  const inquiryRows = document.querySelectorAll('[data-inquiry-row]');
  const filterBtns = document.querySelectorAll('[data-inquiry-filter]');
  const searchInput = document.querySelector('[data-inquiry-search]');
  const emptyRow = document.querySelector('[data-inquiry-empty]');

  let currentFilter = 'all';
  let searchQuery = '';

  function applyInquiryFilters() {
    let visibleCount = 0;
    inquiryRows.forEach((row) => {
      const status = row.getAttribute('data-status');
      const text = row.textContent.toLowerCase();
      const matchesFilter = currentFilter === 'all' || status === currentFilter;
      const matchesSearch = !searchQuery || text.includes(searchQuery);

      if (matchesFilter && matchesSearch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (emptyRow) {
      emptyRow.style.display = visibleCount === 0 ? '' : 'none';
    }
  }

  if (filterBtns.length > 0) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => {
          b.classList.remove('bg-navy', 'text-navy-foreground');
          b.classList.add('bg-card', 'text-muted-foreground');
        });
        btn.classList.add('bg-navy', 'text-navy-foreground');
        btn.classList.remove('bg-card', 'text-muted-foreground');

        currentFilter = btn.getAttribute('data-inquiry-filter');
        applyInquiryFilters();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyInquiryFilters();
    });
  }

  // Inquiry Detail Dialog Modal
  const inquiryModal = document.querySelector('#inquiry-modal');
  const viewBtns = document.querySelectorAll('[data-view-inquiry]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  if (inquiryModal) {
    viewBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id') || '';
        const company = btn.getAttribute('data-company') || '';
        const name = btn.getAttribute('data-name') || '';
        const country = btn.getAttribute('data-country') || '';
        const email = btn.getAttribute('data-email') || '';
        const phone = btn.getAttribute('data-phone') || '';
        const product = btn.getAttribute('data-product') || '';
        const qty = btn.getAttribute('data-qty') || '';
        const msg = btn.getAttribute('data-msg') || '';

        const titleEl = inquiryModal.querySelector('#modal-title');
        if (titleEl) titleEl.textContent = `${company} — ${id}`;

        const nameEl = inquiryModal.querySelector('#modal-name');
        if (nameEl) nameEl.textContent = name;
        const countryEl = inquiryModal.querySelector('#modal-country');
        if (countryEl) countryEl.textContent = country;
        const emailEl = inquiryModal.querySelector('#modal-email');
        if (emailEl) emailEl.textContent = email;
        const phoneEl = inquiryModal.querySelector('#modal-phone');
        if (phoneEl) phoneEl.textContent = phone;
        const productEl = inquiryModal.querySelector('#modal-product');
        if (productEl) productEl.textContent = product;
        const qtyEl = inquiryModal.querySelector('#modal-qty');
        if (qtyEl) qtyEl.textContent = qty;
        const msgEl = inquiryModal.querySelector('#modal-msg');
        if (msgEl) msgEl.textContent = msg;

        inquiryModal.classList.remove('hidden');
      });
    });

    modalCloseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        inquiryModal.classList.add('hidden');
      });
    });

    // Close on backdrop click
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) {
        inquiryModal.classList.add('hidden');
      }
    });
  }

  // 4. Products Admin Sheet / Modal
  const productSheet = document.querySelector('#product-sheet');
  const editProductBtns = document.querySelectorAll('[data-edit-product]');
  const sheetCloseBtns = document.querySelectorAll('[data-sheet-close]');

  if (productSheet) {
    editProductBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-p-name') || '';
        const short = btn.getAttribute('data-p-short') || '';
        const intro = btn.getAttribute('data-p-intro') || '';
        const materials = btn.getAttribute('data-p-materials') || '';

        const nameInput = productSheet.querySelector('#p-name');
        if (nameInput) nameInput.value = name;
        const shortInput = productSheet.querySelector('#p-short');
        if (shortInput) shortInput.value = short;
        const introInput = productSheet.querySelector('#p-intro');
        if (introInput) introInput.value = intro;
        const matInput = productSheet.querySelector('#p-materials');
        if (matInput) matInput.value = materials;

        productSheet.classList.remove('hidden');
      });
    });

    sheetCloseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        productSheet.classList.add('hidden');
      });
    });

    productSheet.addEventListener('click', (e) => {
      if (e.target === productSheet) {
        productSheet.classList.add('hidden');
      }
    });
  }

  // 5. UI Kit Accordion
  const accordionItems = document.querySelectorAll('[data-accordion-trigger]');
  accordionItems.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling;
      const svg = trigger.querySelector('svg');
      if (content) {
        const isCollapsed = content.classList.contains('hidden');
        if (isCollapsed) {
          content.classList.remove('hidden');
          if (svg) svg.classList.add('rotate-180');
        } else {
          content.classList.add('hidden');
          if (svg) svg.classList.remove('rotate-180');
        }
      }
    });
  });

  // UI Kit Toast Simulation
  const toastBtn = document.querySelector('[data-show-toast]');
  if (toastBtn) {
    toastBtn.addEventListener('click', () => {
      const toastEl = document.createElement('div');
      toastEl.className = 'fixed bottom-5 right-5 z-50 rounded-lg border border-border bg-card p-4 shadow-lift flex items-center gap-3 transition-all duration-300';
      toastEl.innerHTML = `
        <span class="h-2 w-2 rounded-full bg-electric"></span>
        <div>
          <p class="text-sm font-semibold text-navy">Saved</p>
          <p class="text-xs text-muted-foreground">Example toast message.</p>
        </div>
      `;
      document.body.appendChild(toastEl);
      setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => toastEl.remove(), 300);
      }, 3000);
    });
  }
});
