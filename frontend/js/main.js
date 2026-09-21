// BLUENEEDLE - Main Website Interactive Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll state
  const header = document.querySelector('header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        header.classList.add('border-b', 'border-border', 'bg-background/90', 'backdrop-blur-md');
        header.classList.remove('bg-background');
      } else {
        header.classList.remove('border-b', 'border-border', 'bg-background/90', 'backdrop-blur-md');
        header.classList.add('bg-background');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Mobile Menu Toggle
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const hamburgerLines = document.querySelectorAll('[data-menu-line]');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        if (hamburgerLines.length === 3) {
          hamburgerLines[0].className = 'absolute left-0 top-0 h-0.5 w-5 bg-navy transition-all';
          hamburgerLines[1].className = 'absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-all';
          hamburgerLines[2].className = 'absolute left-0 top-3 h-0.5 w-5 bg-navy transition-all';
        }
      } else {
        mobileMenu.classList.remove('hidden');
        if (hamburgerLines.length === 3) {
          hamburgerLines[0].className = 'absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-all rotate-45';
          hamburgerLines[1].className = 'absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-all opacity-0';
          hamburgerLines[2].className = 'absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-all -rotate-45';
        }
      }
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (hamburgerLines.length === 3) {
          hamburgerLines[0].className = 'absolute left-0 top-0 h-0.5 w-5 bg-navy transition-all';
          hamburgerLines[1].className = 'absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-all';
          hamburgerLines[2].className = 'absolute left-0 top-3 h-0.5 w-5 bg-navy transition-all';
        }
      });
    });
  }

  // 3. Scroll Reveal Animations
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    // Fallback if observer not supported
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // 4. Real Quote / Inquiry Form Submission to PostgreSQL Backend
  const quoteForms = document.querySelectorAll('[data-quote-form]');
  quoteForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Send Inquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting inquiry...';
      }

      // Collect field values
      const formData = new FormData(form);
      const payload = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        company: formData.get('company') || '',
        country: formData.get('country') || '',
        phone: formData.get('phone') || '',
        product_interest: formData.get('product') || formData.get('product_interest') || '',
        quantity: formData.get('quantity') ? parseInt(formData.get('quantity'), 10) || null : null,
        message: formData.get('message') || '',
      };

      try {
        const response = await fetch('/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const parent = form.parentElement;
          const successDiv = document.createElement('div');
          successDiv.className =
            'rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 sm:p-10 text-center shadow-card sm:col-span-2 transition-all';
          successDiv.innerHTML = `
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 mb-4">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="font-display text-xl sm:text-2xl font-bold text-navy">Inquiry Received Successfully!</h3>
            <p class="mt-3 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
              Thank you, <strong class="text-navy">${result.data.name}</strong>. Your quote request has been registered under reference <strong class="text-navy">#INQ-${String(result.data.id).padStart(4, '0')}</strong>. Our export team will review your specifications and reply to <strong class="text-navy">${result.data.email}</strong> shortly.
            </p>
            <div class="mt-6">
              <button type="button" onclick="location.reload()" class="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy-foreground hover:bg-electric transition-colors">
                Submit another inquiry &rarr;
              </button>
            </div>
          `;
          parent.replaceChild(successDiv, form);
        } else {
          throw new Error(result.error?.message || 'Failed to submit inquiry');
        }
      } catch (err) {
        console.error('Inquiry submission error:', err);
        alert(`Error submitting inquiry: ${err.message}. Please check that the server is running.`);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  });

  // 5. Dynamic Products Rendering from PostgreSQL
  const customerGrid = document.getElementById('customer-products-grid');
  if (customerGrid) {
    loadCustomerProducts();
  }

  async function loadCustomerProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        renderCustomerProducts(data.data);
      }
    } catch (err) {
      console.warn('Could not load dynamic products from API:', err);
    }
  }

  function renderCustomerProducts(products) {
    if (!customerGrid) return;

    customerGrid.innerHTML = products
      .map((p, idx) => {
        let imgSrc = p.image_url || (p.images && p.images.length > 0 ? p.images[0] : '/assets/product-gi.jpg');
        if (imgSrc.startsWith('../assets/')) imgSrc = '/' + imgSrc.replace('../', '');
        if (imgSrc.startsWith('assets/')) imgSrc = '/' + imgSrc;

        const detailLink = p.preview_url || '#contact';

        return `
          <div class="reveal is-visible" style="transition-delay: ${(idx % 3) * 60}ms;">
            <article class="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div class="overflow-hidden bg-secondary aspect-[4/3] w-full">
                <img
                  src="${imgSrc}"
                  alt="${p.name}"
                  loading="lazy"
                  width="1024"
                  height="1024"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onerror="this.src='/assets/product-gi.jpg'"
                />
              </div>
              <div class="flex flex-1 flex-col p-6">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <h3 class="font-display text-lg font-bold uppercase text-navy">${p.name}</h3>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-electric bg-electric/10 px-2 py-0.5 rounded">
                    ${p.category || 'BJJ Gear'}
                  </span>
                </div>
                <p class="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  ${p.description || p.intro || 'Custom manufactured to your specifications and branding.'}
                </p>
                <div class="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
                  <a
                    href="#contact"
                    onclick="const sel = document.querySelector('select[name=\\'product\\']'); if(sel){ sel.value = '${p.name}'; }"
                    class="inline-flex font-display text-xs font-bold uppercase tracking-wider text-electric transition-colors hover:text-navy"
                  >
                    Request Quote &rarr;
                  </a>
                  ${p.moq ? `<span class="text-xs text-muted-foreground">MOQ: ${p.moq} pcs</span>` : ''}
                </div>
              </div>
            </article>
          </div>
        `;
      })
      .join('');
  }
});
