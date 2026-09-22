// BLUENEEDLE - Admin Panel Interactive Scripts with PostgreSQL Backend Integration & JWT Auth

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api';

  // Helper: Authenticated fetch passing JWT token
  function authFetch(url, options = {}) {
    const token = window.blueneedleAuth
      ? window.blueneedleAuth.getToken()
      : localStorage.getItem('blueneedle_admin_token');

    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, { ...options, headers }).then((res) => {
      if (res.status === 401) {
        if (window.blueneedleAuth) {
          window.blueneedleAuth.logout();
        } else {
          window.location.href = 'login.html';
        }
      }
      return res;
    });
  }

  // ==========================================
  // 1. Mobile Sidebar / Nav Toggle
  // ==========================================
  const adminMenuBtn = document.querySelector('[data-admin-menu-toggle]');
  const adminMobileNav = document.querySelector('[data-admin-mobile-nav]');
  if (adminMenuBtn && adminMobileNav) {
    adminMenuBtn.addEventListener('click', () => {
      adminMobileNav.classList.toggle('hidden');
    });
  }

  // ==========================================
  // 2. Settings Tabs
  // ==========================================
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

  // ==========================================
  // 3. Admin Overview Page (index.html)
  // ==========================================
  if (
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname.endsWith('/admin') ||
    window.location.pathname.endsWith('/admin/')
  ) {
    loadOverviewData();
  }

  async function loadOverviewData() {
    try {
      const [inqRes, prodRes] = await Promise.all([
        authFetch(`${API_BASE}/inquiries`).then((r) => r.json()),
        authFetch(`${API_BASE}/products`).then((r) => r.json()),
      ]);

      const inquiries = inqRes.data || [];
      const products = prodRes.data || [];

      // Update stat cards if found
      const statCards = document.querySelectorAll('.grid.gap-5.sm\\:grid-cols-2.xl\\:grid-cols-4 > div');
      if (statCards.length >= 3) {
        const newInqCount = inquiries.filter((i) => i.status === 'new').length;
        const totalInqEl = statCards[0].querySelector('p.font-display');
        if (totalInqEl) totalInqEl.textContent = newInqCount || inquiries.length;

        const quotedCount = inquiries.filter((i) => i.status === 'quoted').length;
        const quotesEl = statCards[1].querySelector('p.font-display');
        if (quotesEl) quotesEl.textContent = quotedCount;

        const activeProdEl = statCards[2]?.querySelector('p.font-display');
        if (activeProdEl) activeProdEl.textContent = products.length;
      }

      // Populate Latest inquiries list
      const latestList = document.querySelector('section ul.divide-y');
      if (latestList && inquiries.length > 0) {
        latestList.innerHTML = inquiries
          .slice(0, 5)
          .map((inq) => {
            const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'Recent';
            const badgeClass =
              inq.status === 'new'
                ? 'bg-primary text-primary-foreground'
                : inq.status === 'quoted'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-accent text-accent-foreground';

            return `
              <li class="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30">
                <div class="min-w-0">
                  <p class="truncate font-medium text-navy">${escapeHtml(inq.company || inq.name)}</p>
                  <p class="truncate text-sm text-muted-foreground">${escapeHtml(inq.product_interest || 'Inquiry')} &middot; ${inq.quantity ? `${inq.quantity} pcs &middot; ` : ''}${escapeHtml(inq.country || inq.email)}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase ${badgeClass}">${inq.status || 'new'}</span>
                  <span class="hidden text-xs text-muted-foreground sm:inline">${dateStr}</span>
                </div>
              </li>
            `;
          })
          .join('');
      }
    } catch (err) {
      console.warn('Could not load overview stats from API:', err);
    }
  }

  // ==========================================
  // 4. Admin Inquiries Page (inquiries.html)
  // ==========================================
  const inquiriesTableBody = document.querySelector('table tbody');
  const inquiryModal = document.querySelector('#inquiry-modal');

  if (window.location.pathname.includes('inquiries.html') && inquiriesTableBody) {
    loadInquiries();
  }

  let allInquiries = [];
  let currentInquiryFilter = 'all';
  let inquirySearchQuery = '';

  async function loadInquiries() {
    try {
      const res = await authFetch(`${API_BASE}/inquiries`);
      const result = await res.json();
      allInquiries = result.data || [];
      renderInquiriesTable();
    } catch (err) {
      console.error('Error fetching inquiries from API:', err);
    }
  }

  function renderInquiriesTable() {
    if (!inquiriesTableBody) return;

    let filtered = allInquiries.filter((inq) => {
      const matchesFilter =
        currentInquiryFilter === 'all' || inq.status?.toLowerCase() === currentInquiryFilter.toLowerCase();
      const searchStr = `${inq.company} ${inq.name} ${inq.email} ${inq.product_interest} ${inq.country}`.toLowerCase();
      const matchesSearch = !inquirySearchQuery || searchStr.includes(inquirySearchQuery);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      inquiriesTableBody.innerHTML = `
        <tr data-inquiry-empty>
          <td colspan="7" class="py-12 text-center text-sm text-muted-foreground">
            No inquiries match this criteria.
          </td>
        </tr>
      `;
      return;
    }

    inquiriesTableBody.innerHTML = filtered
      .map((inq) => {
        const ref = `INQ-${String(inq.id).padStart(4, '0')}`;
        const badgeClass =
          inq.status === 'new'
            ? 'bg-primary text-primary-foreground'
            : inq.status === 'quoted'
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-accent text-accent-foreground';

        return `
          <tr data-inquiry-row data-status="${escapeHtml(inq.status || 'new')}" class="border-b border-border transition-colors hover:bg-muted/50">
            <td class="p-4 align-middle font-mono text-xs text-muted-foreground">${ref}</td>
            <td class="p-4 align-middle">
              <span class="font-medium text-navy">${escapeHtml(inq.company || inq.name)}</span>
              <span class="block text-xs text-muted-foreground">${escapeHtml(inq.name)}</span>
            </td>
            <td class="hidden md:table-cell p-4 align-middle text-muted-foreground">${escapeHtml(inq.country || '-')}</td>
            <td class="hidden sm:table-cell p-4 align-middle text-muted-foreground">${escapeHtml(inq.product_interest || '-')}</td>
            <td class="hidden lg:table-cell p-4 align-middle text-muted-foreground">${inq.quantity ? `${inq.quantity.toLocaleString()} pcs` : '-'}</td>
            <td class="p-4 align-middle">
              <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase ${badgeClass}">${inq.status || 'new'}</span>
            </td>
            <td class="p-4 align-middle text-right">
              <button
                type="button"
                data-view-id="${inq.id}"
                class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                View
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach click listeners to "View" buttons
    inquiriesTableBody.querySelectorAll('[data-view-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-view-id'), 10);
        const inq = allInquiries.find((i) => i.id === id);
        if (inq && inquiryModal) {
          openInquiryModal(inq);
        }
      });
    });
  }

  function openInquiryModal(inq) {
    const ref = `INQ-${String(inq.id).padStart(4, '0')}`;
    const titleEl = inquiryModal.querySelector('#modal-title');
    if (titleEl) titleEl.textContent = `${inq.company || inq.name} — ${ref}`;

    const nameEl = inquiryModal.querySelector('#modal-name');
    if (nameEl) nameEl.textContent = inq.name || '-';
    const countryEl = inquiryModal.querySelector('#modal-country');
    if (countryEl) countryEl.textContent = inq.country || '-';
    const emailEl = inquiryModal.querySelector('#modal-email');
    if (emailEl) emailEl.textContent = inq.email || '-';
    const phoneEl = inquiryModal.querySelector('#modal-phone');
    if (phoneEl) phoneEl.textContent = inq.phone || '-';
    const productEl = inquiryModal.querySelector('#modal-product');
    if (productEl) productEl.textContent = inq.product_interest || '-';
    const qtyEl = inquiryModal.querySelector('#modal-qty');
    if (qtyEl) qtyEl.textContent = inq.quantity ? `${inq.quantity.toLocaleString()} pcs` : '-';
    const msgEl = inquiryModal.querySelector('#modal-msg');
    if (msgEl) msgEl.textContent = inq.message || 'No additional message provided.';

    // Setup "Mark as quoted" button
    const markQuotedBtn = inquiryModal.querySelector('button.bg-navy');
    if (markQuotedBtn) {
      markQuotedBtn.onclick = async () => {
        try {
          markQuotedBtn.textContent = 'Updating...';
          const patchRes = await authFetch(`${API_BASE}/inquiries/${inq.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'quoted' }),
          });
          if (patchRes.ok) {
            inq.status = 'quoted';
            renderInquiriesTable();
            inquiryModal.classList.add('hidden');
          }
        } catch (e) {
          console.error('Error updating status:', e);
        } finally {
          markQuotedBtn.textContent = 'Mark as quoted';
        }
      };
    }

    inquiryModal.classList.remove('hidden');
  }

  // Filter and Search listeners on inquiries page
  const filterBtns = document.querySelectorAll('[data-inquiry-filter]');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('bg-navy', 'text-navy-foreground');
        b.classList.add('bg-card', 'text-muted-foreground');
      });
      btn.classList.add('bg-navy', 'text-navy-foreground');
      btn.classList.remove('bg-card', 'text-muted-foreground');

      currentInquiryFilter = btn.getAttribute('data-inquiry-filter');
      renderInquiriesTable();
    });
  });

  const searchInput = document.querySelector('[data-inquiry-search]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      inquirySearchQuery = e.target.value.trim().toLowerCase();
      renderInquiriesTable();
    });
  }

  if (inquiryModal) {
    inquiryModal.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => inquiryModal.classList.add('hidden'));
    });
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) inquiryModal.classList.add('hidden');
    });
  }

  // ==========================================
  // 5. Admin Products Page (products.html)
  // ==========================================
  const productSheet = document.querySelector('#product-sheet');
  const productsGrid = document.querySelector('[data-products-grid]') || document.querySelector('main .grid');

  if (window.location.pathname.includes('products.html') && productsGrid) {
    loadProducts();
  }

  let allProducts = [];
  let editingProductId = null;

  async function loadProducts() {
    try {
      const res = await authFetch(`${API_BASE}/products`);
      const result = await res.json();
      allProducts = result.data || [];
      renderProductsGrid();
    } catch (err) {
      console.error('Error loading products from API:', err);
    }
  }

  function renderProductsGrid() {
    if (!productsGrid) return;

    if (allProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-muted-foreground">
          No products found in PostgreSQL database.
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = allProducts
      .map((p) => {
        let imgSrc = p.image_url || (p.images && p.images.length > 0 ? p.images[0] : '/assets/product-gi.jpg');
        if (imgSrc.startsWith('../assets/')) imgSrc = '/' + imgSrc.replace('../', '');
        if (imgSrc.startsWith('assets/')) imgSrc = '/' + imgSrc;

        const previewUrl = p.preview_url || `../products/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;

        return `
          <article class="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-lift">
            <div class="aspect-[16/10] w-full overflow-hidden bg-secondary">
              <img src="${imgSrc}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover" onerror="this.src='/assets/product-gi.jpg'" />
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-display text-base font-bold uppercase text-navy">${escapeHtml(p.name)}</h2>
                <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                  p.is_active ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                }">
                  ${p.is_active ? 'Live' : 'Draft'}
                </span>
              </div>
              <p class="mt-2 line-clamp-2 text-sm text-muted-foreground">${escapeHtml(p.description || '')}</p>
              <div class="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-edit-product-id="${p.id}"
                    class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Edit
                  </button>
                  <a href="${previewUrl}" class="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors">
                    Preview
                  </a>
                </div>
                <button
                  type="button"
                  data-delete-product-id="${p.id}"
                  data-product-name="${escapeHtml(p.name)}"
                  class="btn-delete-red"
                  title="Delete product"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Attach edit button listeners
    productsGrid.querySelectorAll('[data-edit-product-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-edit-product-id'), 10);
        const prod = allProducts.find((p) => p.id === id);
        if (prod) openProductSheet(prod);
      });
    });

    // Attach delete button listeners on product cards
    productsGrid.querySelectorAll('[data-delete-product-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-product-id');
        const name = btn.getAttribute('data-product-name') || 'this product';
        showDeleteModal(id, name);
      });
    });
  }

  // Proper UI Dialog Modal for Deletion
  const deleteModal = document.querySelector('#delete-modal');
  let pendingDeleteId = null;

  function showDeleteModal(productId, productName) {
    if (!deleteModal) return;
    pendingDeleteId = productId;
    const nameEl = deleteModal.querySelector('#delete-modal-product-name');
    if (nameEl) nameEl.textContent = productName;

    const confirmBtn = deleteModal.querySelector('#btn-confirm-delete');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Yes, Delete Product</span>
      `;
    }

    deleteModal.classList.remove('hidden');
  }

  function hideDeleteModal() {
    if (deleteModal) {
      deleteModal.classList.add('hidden');
    }
    pendingDeleteId = null;
  }

  if (deleteModal) {
    const cancelBtn = deleteModal.querySelector('#btn-cancel-delete');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', hideDeleteModal);
    }

    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        hideDeleteModal();
      }
    });

    const confirmBtn = deleteModal.querySelector('#btn-confirm-delete');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
          <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Deleting...</span>
        `;

        try {
          const res = await authFetch(`${API_BASE}/products/${pendingDeleteId}`, {
            method: 'DELETE',
          });

          const data = await res.json();
          if (res.ok && data.success) {
            hideDeleteModal();
            if (productSheet && !productSheet.classList.contains('hidden')) {
              productSheet.classList.add('hidden');
            }
            await loadProducts();
          } else {
            alert(`Failed to delete product: ${data.error?.message || 'Server error'}`);
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<span>Retry Delete</span>';
          }
        } catch (err) {
          console.error('Error deleting product:', err);
          alert(`Error deleting product: ${err.message}`);
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<span>Retry Delete</span>';
        }
      });
    }
  }

  let selectedFiles = [];
  let existingImages = [];

  // Helper: Resize & compress images on client before uploading to prevent Vercel 4.5MB payload error
  async function compressImageFile(file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) {
    // If SVG or small file (< 300KB), return as is
    if (file.type === 'image/svg+xml' || file.size < 300 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressed);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  function openProductSheet(prod = null) {
    if (!productSheet) return;
    editingProductId = prod ? prod.id : null;
    selectedFiles = [];
    existingImages = prod && prod.images ? (Array.isArray(prod.images) ? prod.images : []) : [];
    if (prod && prod.image_url && !existingImages.includes(prod.image_url)) {
      existingImages.unshift(prod.image_url);
    }

    const titleEl = productSheet.querySelector('h2');
    if (titleEl) titleEl.textContent = prod ? `Edit ${prod.name}` : 'Add New Product';

    const nameInput = productSheet.querySelector('#p-name');
    if (nameInput) nameInput.value = prod?.name || '';
    const shortInput = productSheet.querySelector('#p-short');
    if (shortInput) shortInput.value = prod?.description || '';
    const introInput = productSheet.querySelector('#p-intro');
    if (introInput) introInput.value = prod?.intro || '';
    const matInput = productSheet.querySelector('#p-materials');
    if (matInput) matInput.value = prod?.materials || '';

    // Active status checkbox
    const activeCheck = productSheet.querySelector('input[type="checkbox"]');
    if (activeCheck) {
      activeCheck.checked = prod ? (prod.is_active ?? true) : true;
    }

    // Toggle delete button visibility in sheet
    const sheetDeleteBtn = productSheet.querySelector('#btn-delete-product');
    if (sheetDeleteBtn) {
      if (prod && prod.id) {
        sheetDeleteBtn.classList.remove('hidden');
        sheetDeleteBtn.onclick = () => {
          showDeleteModal(prod.id, prod.name);
        };
      } else {
        sheetDeleteBtn.classList.add('hidden');
        sheetDeleteBtn.onclick = null;
      }
    }

    // Reset file input and render preview
    const fileInput = productSheet.querySelector('#p-images');
    if (fileInput) fileInput.value = '';
    renderImagePreviews();

    productSheet.classList.remove('hidden');
  }

  function renderImagePreviews() {
    const previewContainer = productSheet?.querySelector('#p-images-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    // Render existing images
    existingImages.forEach((url, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'relative group aspect-square rounded-md overflow-hidden border border-border bg-secondary';
      wrap.innerHTML = `
        <img src="${url}" alt="Product image" class="w-full h-full object-cover" />
        <button type="button" class="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-xs" title="Remove image">
          &times;
        </button>
      `;
      wrap.querySelector('button').addEventListener('click', () => {
        existingImages.splice(idx, 1);
        renderImagePreviews();
      });
      previewContainer.appendChild(wrap);
    });

    // Render newly selected files
    selectedFiles.forEach((file, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'relative group aspect-square rounded-md overflow-hidden border-2 border-electric bg-secondary';
      const objUrl = URL.createObjectURL(file);
      wrap.innerHTML = `
        <img src="${objUrl}" alt="New image" class="w-full h-full object-cover" />
        <span class="absolute bottom-1 left-1 bg-electric text-electric-foreground text-[9px] px-1 rounded font-bold uppercase">New</span>
        <button type="button" class="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-xs" title="Remove file">
          &times;
        </button>
      `;
      wrap.querySelector('button').addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        renderImagePreviews();
      });
      previewContainer.appendChild(wrap);
    });
  }

  // File input change listener for multiple images (with auto-compression)
  const fileInputEl = document.querySelector('#p-images');
  if (fileInputEl) {
    fileInputEl.addEventListener('change', async (e) => {
      const rawFiles = Array.from(e.target.files || []);
      for (const file of rawFiles) {
        const compressed = await compressImageFile(file);
        selectedFiles.push(compressed);
      }
      renderImagePreviews();
    });
  }

  // "Add Product" header button
  const addProductBtn = document.querySelector('header button[data-edit-product]');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => openProductSheet(null));
  }

  // Handle Product Sheet Form Submission (Uploads images via Multer and saves to PostgreSQL!)
  if (productSheet) {
    const sheetForm = productSheet.querySelector('form');
    if (sheetForm) {
      sheetForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = sheetForm.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.textContent : 'Save changes';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Uploading & Saving...';
        }

        const name = sheetForm.querySelector('#p-name')?.value.trim();
        const description = sheetForm.querySelector('#p-short')?.value.trim();
        const intro = sheetForm.querySelector('#p-intro')?.value.trim();
        const materials = sheetForm.querySelector('#p-materials')?.value.trim();
        const isActive = sheetForm.querySelector('input[type="checkbox"]')?.checked ?? true;

        if (!name) {
          alert('Product name is required');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
          return;
        }

        try {
          let uploadedUrls = [];

          // 1. Upload newly selected files (one by one to keep payloads tiny and fast)
          if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
              const formData = new FormData();
              formData.append('images', file);

              const uploadRes = await authFetch(`${API_BASE}/upload/multiple`, {
                method: 'POST',
                body: formData,
              });

              const uploadData = await uploadRes.json();
              if (uploadRes.ok && uploadData.success && uploadData.data) {
                uploadData.data.forEach((r) => uploadedUrls.push(r.url));
              } else {
                throw new Error(uploadData.error?.message || 'Failed to upload image');
              }
            }
          }

          // Combine existing images and newly uploaded image URLs
          const allImageUrls = [...existingImages, ...uploadedUrls];
          const primaryImage = allImageUrls.length > 0 ? allImageUrls[0] : null;

          // 2. Save product record to PostgreSQL
          let res;
          if (editingProductId) {
            res = await authFetch(`${API_BASE}/products/${editingProductId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                description,
                intro,
                materials,
                image_url: primaryImage,
                images: allImageUrls,
                is_active: isActive,
              }),
            });
          } else {
            res = await authFetch(`${API_BASE}/products`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                category: 'BJJ Gear',
                description,
                intro,
                materials,
                image_url: primaryImage,
                images: allImageUrls,
                is_active: isActive,
              }),
            });
          }

          if (res.ok) {
            productSheet.classList.add('hidden');
            await loadProducts();
          } else {
            const errJson = await res.json();
            alert(`Failed saving product: ${errJson.error?.message || 'Server error'}`);
          }
        } catch (err) {
          console.error('Error saving product:', err);
          alert(`Error saving product: ${err.message}`);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
        }
      };
    }

    productSheet.querySelectorAll('[data-sheet-close]').forEach((btn) => {
      btn.addEventListener('click', () => productSheet.classList.add('hidden'));
    });
    productSheet.addEventListener('click', (e) => {
      if (e.target === productSheet) productSheet.classList.add('hidden');
    });
  }

  // ==========================================
  // 6. UI Kit Accordion & Toast Utilities
  // ==========================================
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
