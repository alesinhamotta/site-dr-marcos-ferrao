/* ====================================
   SCRIPT.JS - DR. MARCOS FERRÃO
   Interatividade e Animações
   ==================================== */

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-item button').forEach(button => {
  button.addEventListener('click', function() {
    const resposta = this.nextElementSibling;
    const isActive = this.classList.contains('active');
    
    // Fecha todas as outras respostas
    document.querySelectorAll('.faq-item button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.resposta').forEach(resp => {
      resp.classList.remove('show');
    });
    
    // Abre a resposta clicada
    if (!isActive) {
      this.classList.add('active');
      resposta.classList.add('show');
    }
  });
});

// ===== ANIMAÇÃO AO SCROLL (Intersection Observer) =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observa elementos para animação
document.querySelectorAll('.card, .item, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(el);
});

// ===== EFEITO PARALLAX NO HERO =====
window.addEventListener('scroll', function() {
  const hero = document.querySelector('.hero');
  if (hero) {
    const scrollPosition = window.pageYOffset;
    hero.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
  }
});

// ===== HEADER STICKY COM SHADOW =====
window.addEventListener('scroll', function() {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5)';
  } else {
    header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
  }
});

// ===== ANIMAÇÃO DE NÚMEROS (COUNTER) =====
function animateCounter(element, target, duration = 2000) {
  let current = 0;
  const increment = target / (duration / 16);
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Observa elementos com classe 'counter'
const counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      const target = parseInt(entry.target.dataset.target);
      animateCounter(entry.target, target);
      entry.target.dataset.animated = 'true';
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => {
  counterObserver.observe(el);
});

// ===== EFEITO HOVER NOS CARDS =====
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-15px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

// ===== RIPPLE EFFECT NOS BOTÕES =====
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');
  
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

document.querySelectorAll('.btn-gold, .btn-outline, .btn-header').forEach(btn => {
  btn.addEventListener('click', createRipple);
});

// ===== VALIDAÇÃO DE FORMULÁRIO (se houver) =====
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validação simples
    const inputs = this.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = '#ff6b6b';
        isValid = false;
      } else {
        input.style.borderColor = '#D4AF37';
      }
    });
    
    if (isValid) {
      console.log('Formulário válido!');
      // Aqui você pode enviar os dados para o servidor
      alert('Mensagem enviada com sucesso!');
      this.reset();
    }
  });
}

// ===== MENU MOBILE (Hamburger) =====
function createMobileMenu() {
  const header = document.querySelector('.header-container');
  const nav = document.querySelector('nav');
  
  if (window.innerWidth <= 768 && !document.querySelector('.hamburger')) {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '☰';
    hamburger.style.cssText = `
      background: none;
      border: none;
      color: #D4AF37;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    `;
    
    header.insertBefore(hamburger, header.lastChild);
    
    hamburger.addEventListener('click', function() {
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.cssText = `
        position: absolute;
        top: 70px;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #0c1a2b 0%, #08121c 100%);
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      `;
    });
  }
}

createMobileMenu();
window.addEventListener('resize', createMobileMenu);

// ===== PRELOAD DE IMAGENS =====
function preloadImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      const newImg = new Image();
      newImg.src = src;
    }
  });
}

window.addEventListener('load', preloadImages);

// ===== SCROLL TO TOP BUTTON =====
function createScrollToTopButton() {
  const button = document.createElement('button');
  button.id = 'scrollToTop';
  button.innerHTML = '↑';
  button.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 30px;
    background: linear-gradient(135deg, #D4AF37 0%, #F2D57E 100%);
    color: #1a1a1a;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    display: none;
    z-index: 998;
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(button);
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
    } else {
      button.style.display = 'none';
    }
  });
  
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  button.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.15)';
    this.style.boxShadow = '0 12px 35px rgba(212, 175, 55, 0.5)';
  });
  
  button.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.3)';
  });
}

createScrollToTopButton();

// ===== LAZY LOADING DE IMAGENS =====
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ===== INICIALIZAÇÃO =====
console.log('✅ Script carregado com sucesso!');