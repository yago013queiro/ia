document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Intersection Observer for Reveal Animations
    const observerOptions = { threshold: 0.1 };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Animated Counters (Index Page)
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target + (counter.getAttribute('data-suffix') || '');
                        }
                    };
                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        }, observerOptions);
        counters.forEach(counter => counterObserver.observe(counter));
    }

    // Schedule Filtering (Horarios Page)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const classCells = document.querySelectorAll('.class-cell');
    const dayColumns = document.querySelectorAll('.day-column');

    const applyFilter = (filter) => {
        classCells.forEach(cell => {
            const matches = filter === 'all' || cell.getAttribute('data-type') === filter;
            cell.classList.toggle('faded', !matches);
        });
        dayColumns.forEach(col => {
            const cells = col.querySelectorAll('.class-cell');
            const anyVisible = Array.from(cells).some(c => !c.classList.contains('faded'));
            col.classList.toggle('all-faded', !anyVisible && cells.length > 0);
        });
    };

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyFilter(filter);
            });
        });
    }

    // Day Tabs (mobile, horarios page)
    const dayTabs = document.querySelectorAll('.day-tab');
    const activateDay = (day) => {
        dayColumns.forEach(col => col.classList.toggle('active', col.dataset.day === day));
        dayTabs.forEach(t => t.classList.toggle('active', t.dataset.day === day));
    };
    if (dayTabs.length > 0 && dayColumns.length > 0) {
        activateDay('seg');
        dayTabs.forEach(tab => {
            tab.addEventListener('click', () => activateDay(tab.dataset.day));
        });
    }

    // Modal helpers (smooth fade + scale via .is-open class)
    const openModal = (modal) => {
        if (!modal) return;
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    };

    // Modal Opening Logic
    const classModal = document.getElementById('classModal');
    const modModal = document.getElementById('modalityModal');
    const teacherModal = document.getElementById('teacherModal');

    // Class Details (Horarios)
    if (classModal) {
        classCells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (cell.getAttribute('data-type') === 'musculacao') return;
                classCells.forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');

                const vagas = parseInt(cell.getAttribute('data-vagas')) || 0;
                const total = parseInt(cell.getAttribute('data-total')) || vagas;
                const free = Math.max(0, total - vagas);

                document.getElementById('modalTitle').innerText = cell.dataset.name || 'Aula';
                document.getElementById('profName').innerText = cell.getAttribute('data-prof') || '-';
                document.getElementById('duration').innerText = cell.getAttribute('data-dur') || '-';
                document.getElementById('slots').innerText = total > 0
                    ? `${free} de ${total}`
                    : '-';

                const fill = document.getElementById('slotsBarFill');
                if (fill) {
                    const pct = total > 0 ? Math.round((free / total) * 100) : 0;
                    fill.style.width = pct + '%';
                    fill.classList.remove('near-full', 'full');
                    if (pct === 0) fill.classList.add('full');
                    else if (pct <= 25) fill.classList.add('near-full');
                }

                openModal(classModal);
            });
        });
    }

    // Modality Details (Index)
    const modCards = document.querySelectorAll('.modality-card');
    const modalityInfo = {
        'musculacao':     { cat: 'Treino livre',  tags: ['Hipertrofia', 'Força', 'Resistência'],     price: 'A partir de R$ 79,90/mês',  link: 'musculacao' },
        'jiu-jitsu':      { cat: 'Arte marcial',  tags: ['Defesa pessoal', 'Faixa preta', 'Todos os níveis'], price: 'R$ 89,90/mês',     link: 'jiu-jitsu' },
        'spinning':       { cat: 'Cardio',        tags: ['Alta queima', 'Indoor cycling', '50min'],  price: 'R$ 69,90/mês',              link: 'spinning' },
        'yoga':           { cat: 'Bem-estar',     tags: ['Flexibilidade', 'Equilíbrio', 'Mindfulness'], price: 'R$ 69,90/mês',          link: 'yoga' },
        'funcional':      { cat: 'Aula coletiva', tags: ['Core', 'Agilidade', 'HIIT'],               price: 'R$ 69,90/mês',              link: 'funcional' },
        'massagem':       { cat: 'Recovery',      tags: ['Miofascial', 'Quiropraxia', 'Pós-treino'], price: 'R$ 55/sessão',              link: 'massagem' },
        'cross-training': { cat: 'Alta intensidade', tags: ['WOD diário', 'Força', 'Metcon'],        price: 'R$ 89,90/mês',              link: 'cross' },
        'boxe':           { cat: 'Luta',          tags: ['Técnica', 'Condicionamento', 'Stress relief'], price: 'R$ 79,90/mês',          link: 'boxe' }
    };
    if (modCards.length > 0 && modModal) {
        modCards.forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('h3').innerText;
                const desc = card.getAttribute('data-desc');
                const mod = card.getAttribute('data-mod');
                const info = modalityInfo[mod] || { cat: 'Modalidade', tags: [], price: '', link: '' };
                const bgImg = card.querySelector('.mod-img')?.style.backgroundImage || '';

                document.getElementById('modModalTitle').innerText = title;
                document.getElementById('modModalDesc').innerText = desc;
                document.getElementById('modModalCategory').innerText = info.cat;
                const hero = document.getElementById('modModalHero');
                if (hero) hero.style.backgroundImage = bgImg;

                const tagsEl = document.getElementById('modModalTags');
                if (tagsEl) {
                    tagsEl.innerHTML = '';
                    info.tags.forEach(t => {
                        const span = document.createElement('span');
                        span.className = 'modal-tag';
                        span.innerText = t;
                        tagsEl.appendChild(span);
                    });
                    if (info.price) {
                        const priceTag = document.createElement('span');
                        priceTag.className = 'modal-tag modal-tag-price';
                        priceTag.innerText = info.price;
                        tagsEl.appendChild(priceTag);
                    }
                }

                const reserveBtn = document.getElementById('modModalReserve');
                if (reserveBtn && info.link) {
                    reserveBtn.setAttribute('href', `contato.html?plano=${info.link}`);
                }

                openModal(modModal);
            });
        });
    }

    // Teacher Formation (Equipe)
    const teamCards = document.querySelectorAll('.team-card');
    if (teamCards.length > 0 && teacherModal) {
        teamCards.forEach(card => {
            card.addEventListener('click', () => {
                const name = card.getAttribute('data-name');
                const formation = card.getAttribute('data-formation');
                document.getElementById('teacherModalName').innerText = name;
                document.getElementById('teacherFormation').innerText = formation;
                openModal(teacherModal);
            });
        });
    }

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.modal');
            closeModal(parent);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.is-open').forEach(m => closeModal(m));
        }
    });

    // Price Toggle Logic (Planos Page)
    const priceToggle = document.getElementById('priceToggle');
    const amounts = document.querySelectorAll('.amount');
    const formatBRL = (n) => n.toFixed(2).replace('.', ',');
    if (priceToggle) {
        priceToggle.addEventListener('change', () => {
            amounts.forEach(amount => {
                const monthly = parseFloat(amount.getAttribute('data-monthly'));
                if (isNaN(monthly)) return;
                const value = priceToggle.checked ? monthly * 0.85 : monthly;
                amount.innerText = formatBRL(value);
            });
        });
    }

    // Plan Tabs (Planos Page)
    const planTabs = document.querySelectorAll('.plan-tab');
    const planSections = document.querySelectorAll('.plan-section');
    if (planTabs.length > 0) {
        planTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                planTabs.forEach(t => t.classList.toggle('active', t === tab));
                planSections.forEach(s => s.classList.toggle('active', s.getAttribute('data-section') === target));
            });
        });
    }

    // Pré-seleção de plano via querystring (Contato Page)
    const planSelect = document.getElementById('plan');
    if (planSelect) {
        const params = new URLSearchParams(window.location.search);
        const preset = params.get('plano');
        if (preset) {
            const opt = planSelect.querySelector(`option[value="${preset}"]`);
            if (opt) {
                planSelect.value = preset;
                const modSelect = document.getElementById('modalities');
                if (modSelect) {
                    const modOpt = modSelect.querySelector(`option[value="${preset}"]`);
                    if (modOpt) modOpt.selected = true;
                }
            }
        }
    }

    // Form Mask (Contato Page)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // Form Submission (Contato Page)
    const contactForm = document.getElementById('contactForm');
    const successMsg = document.getElementById('successMsg');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            successMsg.style.display = 'flex';
            contactForm.reset();
            setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
        });
    }
});
