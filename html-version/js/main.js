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
    mobileMenu.querySelectorAll('a').forEach(link => {
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach((el) => observer.observe(el));
  } else {
    // Fallback if observer not supported
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // 4. Quote Form Submission simulation
  const quoteForms = document.querySelectorAll('[data-quote-form]');
  quoteForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const parent = form.parentElement;
      const successDiv = document.createElement('div');
      successDiv.className = 'rounded-lg border border-border bg-secondary p-10 text-center';
      successDiv.innerHTML = `
        <h3 class="font-display text-xl font-bold text-navy">Thank you — your inquiry is ready to send.</h3>
        <p class="mt-3 text-sm text-muted-foreground">
          The form isn't connected to an inbox yet. Share your business email and WhatsApp number and inquiries
          will be delivered straight to you.
        </p>
      `;
      parent.replaceChild(successDiv, form);
    });
  });
});
